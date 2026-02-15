// src/modules/export/interfaces/export.interfaces.ts
import { GlobalRole } from '@prisma/client';

/**
 * Tipos de exportación soportados
 */
export enum ExportFormat {
    PDF = 'PDF',
    JSON = 'JSON',
    CSV = 'CSV',
}

/**
 * Estructura de documento exportable
 */
export interface ExportDocument {
    metadata: ExportMetadata;
    content: ExportContent;
    integrity: IntegrityInfo;
}

export interface ExportMetadata {
    documentId: string;
    exportedAt: string;            // ISO 8601
    exportedBy: {
        userId: string;
        name: string;
        role: GlobalRole;
    };
    format: ExportFormat;
    version: string;
    classification: DataClassification;
}

export interface ExportContent {
    session?: SessionExportData;
    patient?: PatientExportData;
    appointments?: AppointmentExportData[];
}

export interface IntegrityInfo {
    hash: string;                  // SHA-256 del contenido
    algorithm: string;
    generatedAt: string;
    certificateId?: string;        // Para firma digital (futuro)
}

/**
 * Clasificación de datos para exportación
 */
export enum DataClassification {
    PUBLIC = 'PUBLIC',
    INTERNAL = 'INTERNAL',
    CONFIDENTIAL = 'CONFIDENTIAL',
    RESTRICTED = 'RESTRICTED',      // Datos clínicos
}

/**
 * Datos de sesión para exportación
 */
export interface SessionExportData {
    sessionId: string;
    appointmentId: string;

    // Información del paciente (puede estar enmascarada)
    patient: {
        id: string;
        name: string | MaskedField;
        dateOfBirth?: string | MaskedField;
    };

    // Información del terapeuta
    therapist: {
        id: string;
        name: string;
        credentials?: string;
    };

    // Tiempos
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;

    // Narrativa clínica (puede estar enmascarada o no disponible)
    clinicalNarrative: ClinicalNarrativeExport | MaskedField | null;

    // Estado
    isDraft: boolean;
    isLocked: boolean;
    signedAt: string | null;
    signatureHash: string | null;

    // Shadow notes NUNCA se exportan, solo se indica existencia
    hasShadowNote: boolean;
    shadowNoteAccess: 'NONE' | 'OWNER_ONLY';
}

export interface ClinicalNarrativeExport {
    subjectiveReport?: string;
    objectiveObservation?: string;
    assessment?: string;
    plan?: string;
    additionalNotes?: string;
}

export interface PatientExportData {
    id: string;
    externalId: string | MaskedField;
    firstName: string | MaskedField;
    lastName: string | MaskedField;
    dateOfBirth: string | MaskedField;
    gender: string | MaskedField;
    contactPhone: string | MaskedField;
    contactEmail: string | MaskedField;
    emergencyContact: string | MaskedField;
    createdAt: string;
}

export interface AppointmentExportData {
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: string;
    sessionType: string;
    hasSession: boolean;
}

/**
 * Campo enmascarado
 */
export interface MaskedField {
    _masked: true;
    reason: MaskReason;
    placeholder: string;
}

export enum MaskReason {
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
    DATA_CLASSIFICATION = 'DATA_CLASSIFICATION',
    PRIVACY_PROTECTION = 'PRIVACY_PROTECTION',
    REDACTED = 'REDACTED',
}

/**
 * Permisos de exportación por rol
 */
export const EXPORT_PERMISSIONS: Record<GlobalRole, ExportPermissions> = {
    [GlobalRole.TERAPEUTA]: {
        canExportSessions: true,
        canViewNarrative: true,
        canViewPatientPII: true,
        canExportShadowNotes: true,      // Solo propias
        canExportBulk: false,
    },
    [GlobalRole.SUPERVISOR]: {
        canExportSessions: true,
        canViewNarrative: true,
        canViewPatientPII: true,
        canExportShadowNotes: false,
        canExportBulk: true,
    },
    [GlobalRole.AUDITOR]: {
        canExportSessions: true,
        canViewNarrative: true,          // Para auditoría
        canViewPatientPII: false,        // PII enmascarado
        canExportShadowNotes: false,     // NUNCA
        canExportBulk: true,
    },
    [GlobalRole.ASISTENTE]: {
        canExportSessions: false,
        canViewNarrative: false,
        canViewPatientPII: false,
        canExportShadowNotes: false,
        canExportBulk: false,
    },
};

export interface ExportPermissions {
    canExportSessions: boolean;
    canViewNarrative: boolean;
    canViewPatientPII: boolean;
    canExportShadowNotes: boolean;
    canExportBulk: boolean;
}

/**
 * Opciones de exportación
 */
export interface ExportOptions {
    format: ExportFormat;
    includeNarrative: boolean;
    includePatientDetails: boolean;
    maskPII: boolean;
    timezone?: string;
}

/**
 * Estructura para generación de PDF
 */
export interface PdfDocumentStructure {
    header: {
        title: string;
        subtitle: string;
        logo?: string;
        classification: DataClassification;
    };
    footer: {
        generatedBy: string;
        role: GlobalRole;
        integrity: string;
        page: string;
    };
    sections: PdfSection[];
    watermark?: string;
}

export interface PdfSection {
    title: string;
    type: 'metadata' | 'session' | 'narrative' | 'patient' | 'integrity' | 'masked' | 'info';
    content: { label: string; value: string }[];
}
