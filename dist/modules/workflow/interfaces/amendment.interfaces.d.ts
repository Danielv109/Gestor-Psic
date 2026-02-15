import { SessionLegalStatus } from '@prisma/client';
export interface CreateAddendumDto {
    reason: string;
    content: AddendumContent;
}
export interface AddendumContent {
    clinicalCorrection?: string;
    additionalInformation?: string;
    diagnosticUpdate?: string;
    administrativeCorrection?: string;
    notes?: string;
}
export interface SignAddendumDto {
    signatureConfirmation: string;
}
export interface VoidSessionDto {
    reason: string;
    justification: string;
}
export interface AmendmentResult {
    sessionId: string;
    addendumId?: string;
    newLegalStatus: SessionLegalStatus;
    sequenceNumber?: number;
    signatureHash?: string;
}
export declare const LEGAL_STATUS_TRANSITIONS: Record<SessionLegalStatus, SessionLegalStatus[]>;
