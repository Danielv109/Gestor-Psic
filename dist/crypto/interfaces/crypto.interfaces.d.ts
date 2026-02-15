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
export declare enum KeyPurpose {
    CLINICAL_NOTES = "CLINICAL_NOTES",
    SHADOW_NOTES = "SHADOW_NOTES",
    USER_PERSONAL = "USER_PERSONAL"
}
export interface EncryptionResult {
    ciphertext: Buffer;
    iv: Buffer;
    authTag: Buffer;
    keyId: string;
    keyVersion: number;
}
export interface EncryptedPayload {
    encrypted: Buffer;
    iv: Buffer;
    keyId: string;
}
export interface ClinicalNarrative {
    subjectiveReport?: string;
    objectiveObservation?: string;
    assessment?: string;
    plan?: string;
    additionalNotes?: string;
}
export declare class DecryptionError extends Error {
    readonly keyId: string;
    readonly resourceId: string;
    readonly reason: DecryptionFailureReason;
    constructor(message: string, keyId: string, resourceId: string, reason: DecryptionFailureReason);
}
export declare enum DecryptionFailureReason {
    KEY_NOT_FOUND = "KEY_NOT_FOUND",
    KEY_EXPIRED = "KEY_EXPIRED",
    KEY_REVOKED = "KEY_REVOKED",
    INVALID_CIPHERTEXT = "INVALID_CIPHERTEXT",
    AUTH_TAG_MISMATCH = "AUTH_TAG_MISMATCH",
    CORRUPTED_DATA = "CORRUPTED_DATA"
}
