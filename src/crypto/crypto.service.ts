// src/crypto/crypto.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { KeyManagementService } from './key-management.service';
import { AuditService } from '../modules/audit/audit.service';
import {
    ClinicalNarrative,
    EncryptedPayload,
    KeyPurpose,
    DecryptionError,
    DecryptionFailureReason,
} from './interfaces/crypto.interfaces';
import { AuditAction, AuditResource } from '@prisma/client';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * CryptoService
 * 
 * Servicio de cifrado para datos clínicos sensibles.
 * Implementa AES-256-GCM con autenticación.
 * 
 * Casos de uso:
 * 1. ClinicalSessions: Narrativa clínica cifrada con clave del sistema
 * 2. ShadowNotes: Contenido cifrado con clave personal del terapeuta
 */
@Injectable()
export class CryptoService {
    private readonly logger = new Logger(CryptoService.name);

    constructor(
        private readonly keyManagement: KeyManagementService,
        private readonly auditService: AuditService,
    ) { }

    // ============================================================
    // CLINICAL NARRATIVES (Sesiones Clínicas)
    // ============================================================

    /**
     * Cifrar narrativa clínica (estructura SOAP)
     * 
     * @param narrative - Objeto con la narrativa clínica
     * @returns Payload cifrado listo para almacenar en BD
     */
    async encryptClinicalNarrative(
        narrative: ClinicalNarrative,
    ): Promise<EncryptedPayload> {
        // Obtener clave activa para notas clínicas
        const keyMeta = await this.keyManagement.getActiveKey(
            KeyPurpose.CLINICAL_NOTES,
        );
        const key = await this.keyManagement.getKeyById(keyMeta.keyId);

        // Serializar narrativa a JSON
        const plaintext = JSON.stringify(narrative);

        // Generar IV aleatorio
        const iv = crypto.randomBytes(IV_LENGTH);

        // Cifrar
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);

        // Obtener tag de autenticación
        const authTag = cipher.getAuthTag();

        // Concatenar ciphertext + authTag para almacenamiento
        const encryptedWithTag = Buffer.concat([encrypted, authTag]);

        this.logger.debug(
            `Encrypted clinical narrative with key ${keyMeta.keyId} v${keyMeta.version}`,
        );

        return {
            encrypted: encryptedWithTag,
            iv,
            keyId: keyMeta.keyId,
        };
    }

    /**
     * Descifrar narrativa clínica
     * 
     * @param payload - Datos cifrados de la BD
     * @param sessionId - ID de sesión para auditoría de errores
     * @param actorId - ID del usuario que descifra (para auditoría)
     * @returns Narrativa clínica en texto plano
     */
    async decryptClinicalNarrative(
        payload: EncryptedPayload,
        sessionId: string,
        actorId?: string,
    ): Promise<ClinicalNarrative> {
        try {
            // Validar que la clave puede usarse
            await this.keyManagement.validateKeyForDecryption(payload.keyId);

            // Obtener clave
            const key = await this.keyManagement.getKeyById(payload.keyId);

            // Separar ciphertext y authTag
            const encryptedWithTag = payload.encrypted;
            const ciphertext = encryptedWithTag.slice(0, -AUTH_TAG_LENGTH);
            const authTag = encryptedWithTag.slice(-AUTH_TAG_LENGTH);

            // Descifrar
            const decipher = crypto.createDecipheriv(ALGORITHM, key, payload.iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([
                decipher.update(ciphertext),
                decipher.final(),
            ]);

            // Deserializar JSON
            const narrative: ClinicalNarrative = JSON.parse(decrypted.toString('utf8'));

            return narrative;
        } catch (error: unknown) {
            // Determinar tipo de error
            let reason = DecryptionFailureReason.CORRUPTED_DATA;
            let message = 'Failed to decrypt clinical narrative';

            if (error instanceof DecryptionError) {
                reason = error.reason;
                message = error.message;
            } else if (error instanceof Error && error.message?.includes('auth')) {
                reason = DecryptionFailureReason.AUTH_TAG_MISMATCH;
                message = 'Authentication tag verification failed';
            } else if (error instanceof SyntaxError) {
                reason = DecryptionFailureReason.CORRUPTED_DATA;
                message = 'Decrypted data is not valid JSON';
            }

            // Auditar fallo de descifrado
            await this.auditService.log({
                actorId,
                actorIp: 'system',
                action: AuditAction.DECRYPT,
                resource: AuditResource.CLINICAL_SESSION,
                resourceId: sessionId,
                success: false,
                failureReason: `${reason}: ${message}`,
                details: { keyId: payload.keyId },
            });

            this.logger.error(
                `Decryption failed for session ${sessionId}: ${message}`,
            );

            throw new DecryptionError(message, payload.keyId, sessionId, reason);
        }
    }

    // ============================================================
    // SHADOW NOTES (Notas Sombra - Clave Personal)
    // ============================================================

    /**
     * Cifrar contenido de Shadow Note con clave personal del terapeuta
     * 
     * @param content - Texto de la nota sombra
     * @param therapistId - ID del terapeuta propietario
     * @returns Datos cifrados
     */
    async encryptShadowNote(
        content: string,
        therapistId: string,
    ): Promise<{ encrypted: Buffer; iv: Buffer }> {
        // Derivar clave personal del terapeuta
        const personalKey = this.keyManagement.deriveUserPersonalKey(therapistId);

        // Generar IV
        const iv = crypto.randomBytes(IV_LENGTH);

        // Cifrar
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

    /**
     * Descifrar Shadow Note
     * 
     * @param encrypted - Datos cifrados
     * @param iv - Vector de inicialización
     * @param therapistId - ID del terapeuta propietario
     * @param noteId - ID de la nota para auditoría
     * @returns Contenido descifrado
     */
    async decryptShadowNote(
        encrypted: Buffer,
        iv: Buffer,
        therapistId: string,
        noteId: string,
    ): Promise<string> {
        try {
            // Derivar clave personal
            const personalKey = this.keyManagement.deriveUserPersonalKey(therapistId);

            // Separar ciphertext y authTag
            const ciphertext = encrypted.slice(0, -AUTH_TAG_LENGTH);
            const authTag = encrypted.slice(-AUTH_TAG_LENGTH);

            // Descifrar
            const decipher = crypto.createDecipheriv(ALGORITHM, personalKey, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([
                decipher.update(ciphertext),
                decipher.final(),
            ]);

            return decrypted.toString('utf8');
        } catch (error) {
            // Auditar fallo
            await this.auditService.log({
                actorId: therapistId,
                actorIp: 'system',
                action: AuditAction.DECRYPT,
                resource: AuditResource.SHADOW_NOTE,
                resourceId: noteId,
                success: false,
                failureReason: 'Shadow note decryption failed',
            });

            this.logger.error(`Shadow note decryption failed: ${noteId}`);

            throw new DecryptionError(
                'Failed to decrypt shadow note',
                `user-${therapistId}`,
                noteId,
                DecryptionFailureReason.AUTH_TAG_MISMATCH,
            );
        }
    }

    // ============================================================
    // KEY ROTATION
    // ============================================================

    /**
     * Rotar clave de cifrado para notas clínicas
     * 
     * Los datos existentes siguen usando la clave anterior.
     * Los nuevos datos usarán la nueva clave.
     * El descifrado sigue funcionando porque guardamos keyId por registro.
     */
    async rotateKey(purpose: KeyPurpose): Promise<{
        oldVersion: number;
        newVersion: number;
        keyId: string;
    }> {
        const { oldKey, newKey } = await this.keyManagement.rotateKey(purpose);

        this.logger.warn(
            `Key rotated for ${purpose}: v${oldKey.version} -> v${newKey.version}`,
        );

        return {
            oldVersion: oldKey.version,
            newVersion: newKey.version,
            keyId: newKey.keyId,
        };
    }

    /**
     * Re-cifrar datos con nueva clave (para migración post-rotación)
     * 
     * @param oldPayload - Datos cifrados con clave anterior
     * @param sessionId - ID de sesión
     * @param actorId - ID del actor que ejecuta la migración
     */
    async reEncryptClinicalNarrative(
        oldPayload: EncryptedPayload,
        sessionId: string,
        actorId: string,
    ): Promise<EncryptedPayload> {
        // Descifrar con clave anterior
        const narrative = await this.decryptClinicalNarrative(
            oldPayload,
            sessionId,
            actorId,
        );

        // Cifrar con clave nueva (automáticamente usa la activa)
        const newPayload = await this.encryptClinicalNarrative(narrative);

        this.logger.log(
            `Re-encrypted session ${sessionId}: ${oldPayload.keyId} -> ${newPayload.keyId}`,
        );

        return newPayload;
    }

    // ============================================================
    // UTILITIES
    // ============================================================

    /**
     * Generar hash SHA-256 para firmas digitales
     */
    generateHash(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generar signature hash para sesión clínica
     */
    generateSessionSignature(
        sessionId: string,
        therapistId: string,
        timestamp: Date,
    ): string {
        const data = `${sessionId}:${therapistId}:${timestamp.toISOString()}`;
        return this.generateHash(data);
    }

    /**
     * Verificar integridad de datos cifrados
     */
    verifyPayloadIntegrity(payload: EncryptedPayload): boolean {
        // Verificaciones básicas de estructura
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
}
