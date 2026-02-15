// src/crypto/crypto.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CryptoService } from './crypto.service';
import { KeyManagementService } from './key-management.service';
import { AuditService } from '../modules/audit/audit.service';
import {
    mockKeyManagementService,
    mockAuditService,
    mockClinicalNarrative,
    createMockIV,
    createMockEncryptedData,
} from '../test/test-utils';
import { KeyPurpose, DecryptionError, DecryptionFailureReason } from './interfaces/crypto.interfaces';
import * as crypto from 'crypto';

describe('CryptoService', () => {
    let service: CryptoService;
    let keyManagement: ReturnType<typeof mockKeyManagementService>;
    let auditService: ReturnType<typeof mockAuditService>;

    // Generate a real 32-byte key for actual encryption tests
    const realKey = crypto.randomBytes(32);

    beforeEach(async () => {
        keyManagement = mockKeyManagementService();
        auditService = mockAuditService();

        // Mock getKeyById to return a real key for encryption tests
        keyManagement.getKeyById.mockResolvedValue(realKey);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CryptoService,
                { provide: KeyManagementService, useValue: keyManagement },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<CryptoService>(CryptoService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('encryptClinicalNarrative', () => {
        it('should encrypt clinical narrative and return payload', async () => {
            const narrative = mockClinicalNarrative();

            const result = await service.encryptClinicalNarrative(narrative);

            expect(result).toBeDefined();
            expect(result.encrypted).toBeInstanceOf(Buffer);
            expect(result.iv).toBeInstanceOf(Buffer);
            expect(result.iv.length).toBe(16); // 128-bit IV
            expect(result.keyId).toBeDefined();
            expect(keyManagement.getActiveKey).toHaveBeenCalledWith(KeyPurpose.CLINICAL_NOTES);
        });

        it('should produce different ciphertext for same input (random IV)', async () => {
            const narrative = mockClinicalNarrative();

            const result1 = await service.encryptClinicalNarrative(narrative);
            const result2 = await service.encryptClinicalNarrative(narrative);

            // Different IVs
            expect(result1.iv.equals(result2.iv)).toBe(false);
            // Different ciphertext
            expect(result1.encrypted.equals(result2.encrypted)).toBe(false);
        });
    });

    describe('decryptClinicalNarrative', () => {
        it('should decrypt and return original narrative (round-trip)', async () => {
            const originalNarrative = mockClinicalNarrative();

            // Encrypt
            const encrypted = await service.encryptClinicalNarrative(originalNarrative);

            // Decrypt
            const decrypted = await service.decryptClinicalNarrative(
                encrypted,
                'session-uuid-001',
                'actor-uuid-001'
            );

            expect(decrypted).toEqual(originalNarrative);
        });

        it('should throw DecryptionError on tampered ciphertext', async () => {
            const narrative = mockClinicalNarrative();
            const encrypted = await service.encryptClinicalNarrative(narrative);

            // Tamper with the ciphertext
            encrypted.encrypted[10] = encrypted.encrypted[10] ^ 0xff;

            await expect(
                service.decryptClinicalNarrative(encrypted, 'session-uuid-001', 'actor-uuid-001')
            ).rejects.toThrow(DecryptionError);

            // Should log audit failure
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                })
            );
        });

        it('should throw DecryptionError on tampered auth tag', async () => {
            const narrative = mockClinicalNarrative();
            const encrypted = await service.encryptClinicalNarrative(narrative);

            // Tamper with auth tag (last 16 bytes)
            const len = encrypted.encrypted.length;
            encrypted.encrypted[len - 1] = encrypted.encrypted[len - 1] ^ 0xff;

            await expect(
                service.decryptClinicalNarrative(encrypted, 'session-uuid-001', 'actor-uuid-001')
            ).rejects.toThrow(DecryptionError);
        });

        it('should validate key before decryption', async () => {
            const narrative = mockClinicalNarrative();
            const encrypted = await service.encryptClinicalNarrative(narrative);

            await service.decryptClinicalNarrative(encrypted, 'session-uuid-001', 'actor-uuid-001');

            expect(keyManagement.validateKeyForDecryption).toHaveBeenCalledWith(encrypted.keyId);
        });
    });

    describe('encryptShadowNote', () => {
        it('should encrypt shadow note with user personal key', async () => {
            const content = 'Nota personal secreta del terapeuta';
            const therapistId = 'therapist-uuid-001';

            const result = await service.encryptShadowNote(content, therapistId);

            expect(result.encrypted).toBeInstanceOf(Buffer);
            expect(result.iv).toBeInstanceOf(Buffer);
            expect(result.iv.length).toBe(16);
            expect(keyManagement.deriveUserPersonalKey).toHaveBeenCalledWith(therapistId);
        });
    });

    describe('decryptShadowNote', () => {
        it('should decrypt shadow note (round-trip)', async () => {
            const originalContent = 'Nota personal secreta del terapeuta';
            const therapistId = 'therapist-uuid-001';

            // Use real key derivation for this test
            const personalKey = crypto.hkdfSync('sha256', realKey, '', `user-personal-key:${therapistId}`, 32);
            keyManagement.deriveUserPersonalKey.mockReturnValue(Buffer.from(personalKey));

            // Encrypt
            const encrypted = await service.encryptShadowNote(originalContent, therapistId);

            // Decrypt
            const decrypted = await service.decryptShadowNote(
                encrypted.encrypted,
                encrypted.iv,
                therapistId,
                'note-uuid-001'
            );

            expect(decrypted).toBe(originalContent);
        });

        it('should throw DecryptionError when wrong therapist key is used', async () => {
            const content = 'Nota personal secreta';
            const ownerTherapistId = 'owner-therapist';
            const intruderTherapistId = 'intruder-therapist';

            // Derive different keys for owner and intruder
            const ownerKey = Buffer.from(crypto.hkdfSync('sha256', realKey, '', `user-personal-key:${ownerTherapistId}`, 32));
            const intruderKey = Buffer.from(crypto.hkdfSync('sha256', realKey, '', `user-personal-key:${intruderTherapistId}`, 32));

            // Encrypt with owner's key
            keyManagement.deriveUserPersonalKey.mockReturnValue(ownerKey);
            const encrypted = await service.encryptShadowNote(content, ownerTherapistId);

            // Try to decrypt with intruder's key
            keyManagement.deriveUserPersonalKey.mockReturnValue(intruderKey);

            await expect(
                service.decryptShadowNote(encrypted.encrypted, encrypted.iv, intruderTherapistId, 'note-uuid-001')
            ).rejects.toThrow(DecryptionError);

            // Should log audit failure
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    resource: 'SHADOW_NOTE',
                })
            );
        });
    });

    describe('rotateKey', () => {
        it('should rotate key and return old and new versions', async () => {
            const result = await service.rotateKey(KeyPurpose.CLINICAL_NOTES);

            expect(keyManagement.rotateKey).toHaveBeenCalledWith(KeyPurpose.CLINICAL_NOTES);
            expect(result.oldVersion).toBeDefined();
            expect(result.newVersion).toBeDefined();
            expect(result.newVersion).toBeGreaterThan(result.oldVersion);
        });
    });

    describe('reEncryptClinicalNarrative', () => {
        it('should re-encrypt with new key', async () => {
            const narrative = mockClinicalNarrative();

            // Encrypt with old key
            const oldPayload = await service.encryptClinicalNarrative(narrative);

            // Simulate key rotation - new key for encryption
            const newKey = crypto.randomBytes(32);
            keyManagement.getActiveKey.mockResolvedValue({
                keyId: 'new-key-uuid',
                purpose: KeyPurpose.CLINICAL_NOTES,
                version: 2,
                algorithm: 'AES-256-GCM',
                isActive: true,
                createdAt: new Date(),
            });

            // For decryption, use old key
            // For encryption, use new key (next getKeyById call)
            keyManagement.getKeyById
                .mockResolvedValueOnce(realKey)  // First call: decrypt with old key
                .mockResolvedValueOnce(newKey);   // Second call: encrypt with new key

            const newPayload = await service.reEncryptClinicalNarrative(
                oldPayload,
                'session-uuid-001',
                'actor-uuid-001'
            );

            expect(newPayload.keyId).toBe('new-key-uuid');
            expect(newPayload.encrypted).toBeInstanceOf(Buffer);
        });
    });

    describe('generateSessionSignature', () => {
        it('should generate deterministic hash for same inputs', () => {
            const sessionId = 'session-uuid-001';
            const therapistId = 'therapist-uuid-001';
            const timestamp = new Date('2026-02-03T12:00:00Z');

            const hash1 = service.generateSessionSignature(sessionId, therapistId, timestamp);
            const hash2 = service.generateSessionSignature(sessionId, therapistId, timestamp);

            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 hex
        });

        it('should produce different hash for different inputs', () => {
            const timestamp = new Date();

            const hash1 = service.generateSessionSignature('session-1', 'therapist-1', timestamp);
            const hash2 = service.generateSessionSignature('session-2', 'therapist-1', timestamp);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('verifyPayloadIntegrity', () => {
        it('should return true for valid payload', () => {
            const payload = {
                encrypted: createMockEncryptedData(),
                iv: createMockIV(),
                keyId: 'key-uuid-001',
            };

            expect(service.verifyPayloadIntegrity(payload)).toBe(true);
        });

        it('should return false for missing fields', () => {
            expect(service.verifyPayloadIntegrity({ encrypted: null, iv: null, keyId: null } as any)).toBe(false);
            expect(service.verifyPayloadIntegrity({ encrypted: Buffer.alloc(0), iv: Buffer.alloc(0), keyId: '' } as any)).toBe(false);
        });

        it('should return false for invalid IV length', () => {
            const payload = {
                encrypted: createMockEncryptedData(),
                iv: Buffer.alloc(8), // Should be 16
                keyId: 'key-uuid-001',
            };

            expect(service.verifyPayloadIntegrity(payload)).toBe(false);
        });

        it('should return false for encrypted data shorter than auth tag', () => {
            const payload = {
                encrypted: Buffer.alloc(10), // Less than 16-byte auth tag
                iv: createMockIV(),
                keyId: 'key-uuid-001',
            };

            expect(service.verifyPayloadIntegrity(payload)).toBe(false);
        });
    });
});
