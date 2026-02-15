"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CryptoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const key_management_service_1 = require("./key-management.service");
const audit_service_1 = require("../modules/audit/audit.service");
const crypto_interfaces_1 = require("./interfaces/crypto.interfaces");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
let CryptoService = CryptoService_1 = class CryptoService {
    constructor(keyManagement, auditService) {
        this.keyManagement = keyManagement;
        this.auditService = auditService;
        this.logger = new common_1.Logger(CryptoService_1.name);
    }
    async encryptClinicalNarrative(narrative) {
        const keyMeta = await this.keyManagement.getActiveKey(crypto_interfaces_1.KeyPurpose.CLINICAL_NOTES);
        const key = await this.keyManagement.getKeyById(keyMeta.keyId);
        const plaintext = JSON.stringify(narrative);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        const encryptedWithTag = Buffer.concat([encrypted, authTag]);
        this.logger.debug(`Encrypted clinical narrative with key ${keyMeta.keyId} v${keyMeta.version}`);
        return {
            encrypted: encryptedWithTag,
            iv,
            keyId: keyMeta.keyId,
        };
    }
    async decryptClinicalNarrative(payload, sessionId, actorId) {
        try {
            await this.keyManagement.validateKeyForDecryption(payload.keyId);
            const key = await this.keyManagement.getKeyById(payload.keyId);
            const encryptedWithTag = payload.encrypted;
            const ciphertext = encryptedWithTag.slice(0, -AUTH_TAG_LENGTH);
            const authTag = encryptedWithTag.slice(-AUTH_TAG_LENGTH);
            const decipher = crypto.createDecipheriv(ALGORITHM, key, payload.iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([
                decipher.update(ciphertext),
                decipher.final(),
            ]);
            const narrative = JSON.parse(decrypted.toString('utf8'));
            return narrative;
        }
        catch (error) {
            let reason = crypto_interfaces_1.DecryptionFailureReason.CORRUPTED_DATA;
            let message = 'Failed to decrypt clinical narrative';
            if (error instanceof crypto_interfaces_1.DecryptionError) {
                reason = error.reason;
                message = error.message;
            }
            else if (error instanceof Error && error.message?.includes('auth')) {
                reason = crypto_interfaces_1.DecryptionFailureReason.AUTH_TAG_MISMATCH;
                message = 'Authentication tag verification failed';
            }
            else if (error instanceof SyntaxError) {
                reason = crypto_interfaces_1.DecryptionFailureReason.CORRUPTED_DATA;
                message = 'Decrypted data is not valid JSON';
            }
            await this.auditService.log({
                actorId,
                actorIp: 'system',
                action: client_1.AuditAction.DECRYPT,
                resource: client_1.AuditResource.CLINICAL_SESSION,
                resourceId: sessionId,
                success: false,
                failureReason: `${reason}: ${message}`,
                details: { keyId: payload.keyId },
            });
            this.logger.error(`Decryption failed for session ${sessionId}: ${message}`);
            throw new crypto_interfaces_1.DecryptionError(message, payload.keyId, sessionId, reason);
        }
    }
    async encryptShadowNote(content, therapistId) {
        const personalKey = this.keyManagement.deriveUserPersonalKey(therapistId);
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, personalKey, iv);
        const encrypted = Buffer.concat([
            cipher.update(content, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        const encryptedWithTag = Buffer.concat([encrypted, authTag]);
        this.logger.debug(`Encrypted shadow note for therapist ${therapistId}`);
        return { encrypted: encryptedWithTag, iv };
    }
    async decryptShadowNote(encrypted, iv, therapistId, noteId) {
        try {
            const personalKey = this.keyManagement.deriveUserPersonalKey(therapistId);
            const ciphertext = encrypted.slice(0, -AUTH_TAG_LENGTH);
            const authTag = encrypted.slice(-AUTH_TAG_LENGTH);
            const decipher = crypto.createDecipheriv(ALGORITHM, personalKey, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([
                decipher.update(ciphertext),
                decipher.final(),
            ]);
            return decrypted.toString('utf8');
        }
        catch (error) {
            await this.auditService.log({
                actorId: therapistId,
                actorIp: 'system',
                action: client_1.AuditAction.DECRYPT,
                resource: client_1.AuditResource.SHADOW_NOTE,
                resourceId: noteId,
                success: false,
                failureReason: 'Shadow note decryption failed',
            });
            this.logger.error(`Shadow note decryption failed: ${noteId}`);
            throw new crypto_interfaces_1.DecryptionError('Failed to decrypt shadow note', `user-${therapistId}`, noteId, crypto_interfaces_1.DecryptionFailureReason.AUTH_TAG_MISMATCH);
        }
    }
    async rotateKey(purpose) {
        const { oldKey, newKey } = await this.keyManagement.rotateKey(purpose);
        this.logger.warn(`Key rotated for ${purpose}: v${oldKey.version} -> v${newKey.version}`);
        return {
            oldVersion: oldKey.version,
            newVersion: newKey.version,
            keyId: newKey.keyId,
        };
    }
    async reEncryptClinicalNarrative(oldPayload, sessionId, actorId) {
        const narrative = await this.decryptClinicalNarrative(oldPayload, sessionId, actorId);
        const newPayload = await this.encryptClinicalNarrative(narrative);
        this.logger.log(`Re-encrypted session ${sessionId}: ${oldPayload.keyId} -> ${newPayload.keyId}`);
        return newPayload;
    }
    generateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    generateSessionSignature(sessionId, therapistId, timestamp) {
        const data = `${sessionId}:${therapistId}:${timestamp.toISOString()}`;
        return this.generateHash(data);
    }
    verifyPayloadIntegrity(payload) {
        if (!payload.encrypted || !payload.iv || !payload.keyId) {
            return false;
        }
        if (payload.iv.length !== IV_LENGTH) {
            return false;
        }
        if (payload.encrypted.length < AUTH_TAG_LENGTH) {
            return false;
        }
        return true;
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = CryptoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [key_management_service_1.KeyManagementService,
        audit_service_1.AuditService])
], CryptoService);
//# sourceMappingURL=crypto.service.js.map