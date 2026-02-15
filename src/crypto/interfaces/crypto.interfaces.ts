// src/crypto/interfaces/crypto.interfaces.ts

/**
 * Metadata de clave de cifrado
 * La clave real NUNCA se expone - solo referencia al HSM/Vault
 */
export interface EncryptionKeyMetadata {
    keyId: string;
    purpose: KeyPurpose;
    version: number;
    algorithm: string;
    isActive: boolean;
    createdAt: Date;
    rotatedAt?: Date;
    expiresAt?: Date;
}

export enum KeyPurpose {
    CLINICAL_NOTES = 'CLINICAL_NOTES',
    SHADOW_NOTES = 'SHADOW_NOTES',
    USER_PERSONAL = 'USER_PERSONAL',
}

/**
 * Resultado de cifrado
 */
export interface EncryptionResult {
    ciphertext: Buffer;
    iv: Buffer;
    authTag: Buffer;
    keyId: string;
    keyVersion: number;
}

/**
 * Estructura serializada para almacenar en BD
 */
export interface EncryptedPayload {
    // Ciphertext + AuthTag concatenados
    encrypted: Buffer;
    iv: Buffer;
    keyId: string;
}

/**
 * Narrativa clínica estructura SOAP
 */
export interface ClinicalNarrative {
    subjectiveReport?: string;
    objectiveObservation?: string;
    assessment?: string;
    plan?: string;
    additionalNotes?: string;
}

/**
 * Error de descifrado con contexto para auditoría
 */
export class DecryptionError extends Error {
    constructor(
        message: string,
        public readonly keyId: string,
        public readonly resourceId: string,
        public readonly reason: DecryptionFailureReason,
    ) {
        super(message);
        this.name = 'DecryptionError';
    }
}

export enum DecryptionFailureReason {
    KEY_NOT_FOUND = 'KEY_NOT_FOUND',
    KEY_EXPIRED = 'KEY_EXPIRED',
    KEY_REVOKED = 'KEY_REVOKED',
    INVALID_CIPHERTEXT = 'INVALID_CIPHERTEXT',
    AUTH_TAG_MISMATCH = 'AUTH_TAG_MISMATCH',
    CORRUPTED_DATA = 'CORRUPTED_DATA',
}
