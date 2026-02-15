// src/modules/audit/interfaces/audit.interfaces.ts

/**
 * Tipos de recursos para Legal Hold y Export
 */
export type LegalHoldResourceType = 'PATIENT' | 'CLINICAL_SESSION' | 'SHADOW_NOTE';
export type ExportResourceType = 'SESSION' | 'PATIENT_HISTORY' | 'AUDIT_REPORT';
export type ExportFormat = 'JSON' | 'PDF' | 'CSV';

/**
 * DTO para crear Legal Hold
 */
export interface CreateLegalHoldDto {
    resourceType: LegalHoldResourceType;
    resourceId: string;
    reason: string;
    caseNumber?: string;
    holdUntil?: Date;
}

/**
 * DTO para liberar Legal Hold
 */
export interface ReleaseLegalHoldDto {
    releaseReason: string;
}

/**
 * DTO para registrar exportación
 */
export interface LogExportDto {
    resourceType: ExportResourceType;
    resourceId: string;
    patientId?: string;
    format: ExportFormat;
    includesPII: boolean;
    maskedPII: boolean;
    recordCount?: number;
    fileSizeBytes?: number;
    success?: boolean;
}

/**
 * DTO para acceso sensible
 */
export interface SensitiveAccessLog {
    resourceType: string;
    resourceId: string;
    patientId?: string;
    accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT';
    fields?: string[]; // Campos específicos accedidos
}

/**
 * Resultado de verificación de Legal Hold
 */
export interface LegalHoldCheckResult {
    hasHold: boolean;
    holds: Array<{
        id: string;
        reason: string;
        caseNumber?: string;
        holdUntil?: Date;
        createdAt: Date;
    }>;
}
