import { KeyManagementService } from './key-management.service';
import { AuditService } from '../modules/audit/audit.service';
import { ClinicalNarrative, EncryptedPayload, KeyPurpose } from './interfaces/crypto.interfaces';
export declare class CryptoService {
    private readonly keyManagement;
    private readonly auditService;
    private readonly logger;
    constructor(keyManagement: KeyManagementService, auditService: AuditService);
    encryptClinicalNarrative(narrative: ClinicalNarrative): Promise<EncryptedPayload>;
    decryptClinicalNarrative(payload: EncryptedPayload, sessionId: string, actorId?: string): Promise<ClinicalNarrative>;
    encryptShadowNote(content: string, therapistId: string): Promise<{
        encrypted: Buffer;
        iv: Buffer;
    }>;
    decryptShadowNote(encrypted: Buffer, iv: Buffer, therapistId: string, noteId: string): Promise<string>;
    rotateKey(purpose: KeyPurpose): Promise<{
        oldVersion: number;
        newVersion: number;
        keyId: string;
    }>;
    reEncryptClinicalNarrative(oldPayload: EncryptedPayload, sessionId: string, actorId: string): Promise<EncryptedPayload>;
    generateHash(data: string): string;
    generateSessionSignature(sessionId: string, therapistId: string, timestamp: Date): string;
    verifyPayloadIntegrity(payload: EncryptedPayload): boolean;
}
