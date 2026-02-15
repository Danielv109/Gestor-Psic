import { GlobalRole } from '@prisma/client';
export declare enum ExportFormat {
    PDF = "PDF",
    JSON = "JSON",
    CSV = "CSV"
}
export interface ExportDocument {
    metadata: ExportMetadata;
    content: ExportContent;
    integrity: IntegrityInfo;
}
export interface ExportMetadata {
    documentId: string;
    exportedAt: string;
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
    hash: string;
    algorithm: string;
    generatedAt: string;
    certificateId?: string;
}
export declare enum DataClassification {
    PUBLIC = "PUBLIC",
    INTERNAL = "INTERNAL",
    CONFIDENTIAL = "CONFIDENTIAL",
    RESTRICTED = "RESTRICTED"
}
export interface SessionExportData {
    sessionId: string;
    appointmentId: string;
    patient: {
        id: string;
        name: string | MaskedField;
        dateOfBirth?: string | MaskedField;
    };
    therapist: {
        id: string;
        name: string;
        credentials?: string;
    };
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    clinicalNarrative: ClinicalNarrativeExport | MaskedField | null;
    isDraft: boolean;
    isLocked: boolean;
    signedAt: string | null;
    signatureHash: string | null;
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
export interface MaskedField {
    _masked: true;
    reason: MaskReason;
    placeholder: string;
}
export declare enum MaskReason {
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    DATA_CLASSIFICATION = "DATA_CLASSIFICATION",
    PRIVACY_PROTECTION = "PRIVACY_PROTECTION",
    REDACTED = "REDACTED"
}
export declare const EXPORT_PERMISSIONS: Record<GlobalRole, ExportPermissions>;
export interface ExportPermissions {
    canExportSessions: boolean;
    canViewNarrative: boolean;
    canViewPatientPII: boolean;
    canExportShadowNotes: boolean;
    canExportBulk: boolean;
}
export interface ExportOptions {
    format: ExportFormat;
    includeNarrative: boolean;
    includePatientDetails: boolean;
    maskPII: boolean;
    timezone?: string;
}
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
    content: {
        label: string;
        value: string;
    }[];
}
