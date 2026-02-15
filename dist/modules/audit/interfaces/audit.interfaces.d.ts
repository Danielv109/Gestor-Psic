export type LegalHoldResourceType = 'PATIENT' | 'CLINICAL_SESSION' | 'SHADOW_NOTE';
export type ExportResourceType = 'SESSION' | 'PATIENT_HISTORY' | 'AUDIT_REPORT';
export type ExportFormat = 'JSON' | 'PDF' | 'CSV';
export interface CreateLegalHoldDto {
    resourceType: LegalHoldResourceType;
    resourceId: string;
    reason: string;
    caseNumber?: string;
    holdUntil?: Date;
}
export interface ReleaseLegalHoldDto {
    releaseReason: string;
}
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
export interface SensitiveAccessLog {
    resourceType: string;
    resourceId: string;
    patientId?: string;
    accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT';
    fields?: string[];
}
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
