// src/crypto/key-management.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { KeyManagementService } from './key-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { KeyPurpose, DecryptionError, DecryptionFailureReason } from './interfaces/crypto.interfaces';
import { mockPrismaService, mockEncryptionKey } from '../test/test-utils';

describe('KeyManagementService', () => {
    let service: KeyManagementService;
    let prisma: ReturnType<typeof mockPrismaService>;
    let configService: { get: jest.Mock };

    // Valid 64-character hex string (32 bytes)
    const validMasterKey = 'a'.repeat(64);

    beforeEach(async () => {
        prisma = mockPrismaService();
        configService = {
            get: jest.fn().mockReturnValue(validMasterKey),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KeyManagementService,
                { provide: PrismaService, useValue: prisma },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<KeyManagementService>(KeyManagementService);

        // Initialize the service
        await service.onModuleInit();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize master key from configuration', async () => {
            expect(configService.get).toHaveBeenCalledWith('ENCRYPTION_MASTER_KEY');
        });

        it('should throw error if master key is missing', async () => {
            configService.get.mockReturnValue(undefined);

            const newService = new KeyManagementService(
                configService as unknown as ConfigService,
                prisma as unknown as PrismaService
            );

            await expect(newService.onModuleInit()).rejects.toThrow('ENCRYPTION_MASTER_KEY is required');
        });

        it('should throw error if master key has wrong length', async () => {
            configService.get.mockReturnValue('tooshort');

            const newService = new KeyManagementService(
                configService as unknown as ConfigService,
                prisma as unknown as PrismaService
            );

            await expect(newService.onModuleInit()).rejects.toThrow('must be exactly 64 hex characters');
        });

        it('should load active keys from database on init', async () => {
            const activeKeys = [
                mockEncryptionKey({ id: 'key-1', purpose: KeyPurpose.CLINICAL_NOTES }),
                mockEncryptionKey({ id: 'key-2', purpose: KeyPurpose.SHADOW_NOTES }),
            ];
            prisma.encryptionKey.findMany.mockResolvedValue(activeKeys);

            await service.onModuleInit();

            expect(prisma.encryptionKey.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
            });
        });
    });

    describe('getActiveKey', () => {
        it('should return active key from cache', async () => {
            const keyMetadata = mockEncryptionKey({ purpose: KeyPurpose.CLINICAL_NOTES });
            prisma.encryptionKey.findMany.mockResolvedValue([keyMetadata]);

            // Re-init to load the key
            await service.onModuleInit();

            const result = await service.getActiveKey(KeyPurpose.CLINICAL_NOTES);

            expect(result).toBeDefined();
            expect(result.purpose).toBe(KeyPurpose.CLINICAL_NOTES);
            expect(result.isActive).toBe(true);
        });

        it('should skip expired keys', async () => {
            const expiredKey = mockEncryptionKey({
                purpose: KeyPurpose.CLINICAL_NOTES,
                expiresAt: new Date('2020-01-01'), // Past date
            });
            prisma.encryptionKey.findMany.mockResolvedValue([expiredKey]);

            await service.onModuleInit();

            // Should create new key since the cached one is expired
            prisma.encryptionKey.findFirst.mockResolvedValue(expiredKey);

            const result = await service.getActiveKey(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.create).toHaveBeenCalled();
        });

        it('should create new key if none exists for purpose', async () => {
            prisma.encryptionKey.findMany.mockResolvedValue([]);
            prisma.encryptionKey.findFirst.mockResolvedValue(null);

            const result = await service.getActiveKey(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    purpose: KeyPurpose.CLINICAL_NOTES,
                    version: 1,
                    algorithm: 'AES-256-GCM',
                    isActive: true,
                }),
            });
        });
    });

    describe('createKey', () => {
        it('should create new key with incremented version', async () => {
            const existingKey = mockEncryptionKey({ version: 3 });
            prisma.encryptionKey.findFirst.mockResolvedValue(existingKey);

            await service.createKey(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    version: 4, // Incremented
                }),
            });
        });

        it('should start at version 1 if no existing keys', async () => {
            prisma.encryptionKey.findFirst.mockResolvedValue(null);

            await service.createKey(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    version: 1,
                }),
            });
        });

        it('should set vault key path correctly', async () => {
            prisma.encryptionKey.findFirst.mockResolvedValue(null);

            await service.createKey(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    vaultKeyPath: 'vault://syntegra/keys/CLINICAL_NOTES/v1',
                }),
            });
        });
    });

    describe('rotateKey', () => {
        it('should deactivate old key and create new one', async () => {
            const currentKey = mockEncryptionKey({
                id: 'old-key-id',
                version: 1,
                purpose: KeyPurpose.CLINICAL_NOTES,
            });
            prisma.encryptionKey.findMany.mockResolvedValue([currentKey]);
            prisma.encryptionKey.findFirst.mockResolvedValue(currentKey);

            await service.onModuleInit();

            const result = await service.rotateKey(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.update).toHaveBeenCalledWith({
                where: { id: currentKey.id },
                data: {
                    isActive: false,
                    rotatedAt: expect.any(Date),
                },
            });

            expect(result.oldKey.isActive).toBe(false);
            expect(result.newKey.version).toBeGreaterThan(result.oldKey.version);
        });
    });

    describe('getKeyById', () => {
        it('should return key from cache if available', async () => {
            const key = mockEncryptionKey({ id: 'cached-key' });
            prisma.encryptionKey.findMany.mockResolvedValue([key]);

            await service.onModuleInit();

            const result = await service.getKeyById('cached-key');

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBe(32); // 256-bit key
            expect(prisma.encryptionKey.findUnique).not.toHaveBeenCalled();
        });

        it('should load key from database if not in cache', async () => {
            const key = mockEncryptionKey({ id: 'db-key' });
            prisma.encryptionKey.findUnique.mockResolvedValue(key);

            const result = await service.getKeyById('db-key');

            expect(prisma.encryptionKey.findUnique).toHaveBeenCalledWith({
                where: { id: 'db-key' },
            });
            expect(result).toBeInstanceOf(Buffer);
        });

        it('should throw DecryptionError if key not found', async () => {
            prisma.encryptionKey.findUnique.mockResolvedValue(null);

            await expect(
                service.getKeyById('non-existent-key')
            ).rejects.toThrow(DecryptionError);

            await expect(
                service.getKeyById('non-existent-key')
            ).rejects.toMatchObject({
                reason: DecryptionFailureReason.KEY_NOT_FOUND,
            });
        });
    });

    describe('deriveUserPersonalKey', () => {
        it('should derive deterministic key for same user', () => {
            const userId = 'user-uuid-001';

            const key1 = service.deriveUserPersonalKey(userId);
            const key2 = service.deriveUserPersonalKey(userId);

            expect(key1.equals(key2)).toBe(true);
            expect(key1.length).toBe(32); // 256-bit key
        });

        it('should derive different keys for different users', () => {
            const key1 = service.deriveUserPersonalKey('user-1');
            const key2 = service.deriveUserPersonalKey('user-2');

            expect(key1.equals(key2)).toBe(false);
        });
    });

    describe('validateKeyForDecryption', () => {
        it('should pass for valid active key', async () => {
            const key = mockEncryptionKey({ id: 'valid-key' });
            prisma.encryptionKey.findMany.mockResolvedValue([key]);

            await service.onModuleInit();

            await expect(
                service.validateKeyForDecryption('valid-key')
            ).resolves.toBeUndefined();
        });

        it('should throw DecryptionError for expired key', async () => {
            const expiredKey = mockEncryptionKey({
                id: 'expired-key',
                expiresAt: new Date('2020-01-01'),
            });
            prisma.encryptionKey.findMany.mockResolvedValue([expiredKey]);

            await service.onModuleInit();

            await expect(
                service.validateKeyForDecryption('expired-key')
            ).rejects.toThrow(DecryptionError);

            await expect(
                service.validateKeyForDecryption('expired-key')
            ).rejects.toMatchObject({
                reason: DecryptionFailureReason.KEY_EXPIRED,
            });
        });

        it('should attempt to load uncached key', async () => {
            const key = mockEncryptionKey({ id: 'uncached-key' });
            prisma.encryptionKey.findUnique.mockResolvedValue(key);

            await service.validateKeyForDecryption('uncached-key');

            expect(prisma.encryptionKey.findUnique).toHaveBeenCalledWith({
                where: { id: 'uncached-key' },
            });
        });
    });

    describe('listKeys', () => {
        it('should return all keys for a purpose', async () => {
            const keys = [
                mockEncryptionKey({ version: 1, isActive: false }),
                mockEncryptionKey({ version: 2, isActive: true }),
            ];
            prisma.encryptionKey.findMany.mockResolvedValue(keys);

            const result = await service.listKeys(KeyPurpose.CLINICAL_NOTES);

            expect(prisma.encryptionKey.findMany).toHaveBeenCalledWith({
                where: { purpose: KeyPurpose.CLINICAL_NOTES },
                orderBy: { version: 'desc' },
            });
            expect(result).toHaveLength(2);
        });
    });
});
