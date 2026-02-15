// src/modules/workflow/interfaces/amendment.interfaces.ts
import { SessionLegalStatus } from '@prisma/client';

/**
 * DTO para crear un addendum
 */
export interface CreateAddendumDto {
    /** Razón del addendum (obligatoria para cumplimiento legal) */
    reason: string;

    /** Contenido del addendum */
    content: AddendumContent;
}

/**
 * Contenido estructurado del addendum
 */
export interface AddendumContent {
    /** Corrección o aclaración de información clínica */
    clinicalCorrection?: string;

    /** Información adicional omitida */
    additionalInformation?: string;

    /** Actualización de diagnóstico */
    diagnosticUpdate?: string;

    /** Corrección administrativa */
    administrativeCorrection?: string;

    /** Notas adicionales */
    notes?: string;
}

/**
 * DTO para firmar un addendum
 */
export interface SignAddendumDto {
    /** Confirmación textual del contenido */
    signatureConfirmation: string;
}

/**
 * DTO para anular una sesión
 */
export interface VoidSessionDto {
    /** Razón de anulación (obligatoria) */
    reason: string;

    /** Justificación clínica/legal */
    justification: string;
}

/**
 * Resultado de operación de amendment
 */
export interface AmendmentResult {
    sessionId: string;
    addendumId?: string;
    newLegalStatus: SessionLegalStatus;
    sequenceNumber?: number;
    signatureHash?: string;
}

/**
 * Transiciones válidas de legalStatus
 */
export const LEGAL_STATUS_TRANSITIONS: Record<SessionLegalStatus, SessionLegalStatus[]> = {
    [SessionLegalStatus.DRAFT]: [SessionLegalStatus.PENDING_REVIEW],
    [SessionLegalStatus.PENDING_REVIEW]: [SessionLegalStatus.SIGNED, SessionLegalStatus.DRAFT],
    [SessionLegalStatus.SIGNED]: [SessionLegalStatus.AMENDED, SessionLegalStatus.VOIDED],
    [SessionLegalStatus.AMENDED]: [SessionLegalStatus.VOIDED], // Puede anularse después de enmiendas
    [SessionLegalStatus.VOIDED]: [], // Estado final
};
