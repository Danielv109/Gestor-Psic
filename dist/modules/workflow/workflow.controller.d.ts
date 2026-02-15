import { ClinicalWorkflowService } from './clinical-workflow.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
declare class StartSessionDto {
    initialNarrative?: {
        subjectiveReport?: string;
        objectiveObservation?: string;
        assessment?: string;
        plan?: string;
    };
}
declare class EndSessionDto {
    narrative: {
        subjectiveReport?: string;
        objectiveObservation?: string;
        assessment?: string;
        plan?: string;
        additionalNotes?: string;
    };
}
declare class SignSessionDto {
    signatureConfirmation: string;
}
declare class CancelAppointmentDto {
    reason: string;
}
export declare class WorkflowController {
    private readonly workflowService;
    constructor(workflowService: ClinicalWorkflowService);
    getWorkflowStatus(id: string): Promise<{
        appointment: {
            id: string;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            statusDescription: string;
            isFinal: boolean;
            availableTransitions: import(".prisma/client").$Enums.AppointmentStatus[];
            canCreateSession: boolean;
        };
        session: {
            id: string;
            startedAt: Date;
            endedAt: Date | null;
            durationMinutes: number | null;
            isDraft: boolean;
            isLocked: boolean;
            isSigned: boolean;
        } | null;
        workflow: {
            stage: string;
            nextAction: string | null;
        };
    }>;
    confirmAppointment(id: string, user: AuthenticatedUser): Promise<{
        message: string;
        appointment: {
            id: string;
            patientId: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            therapistId: string;
            scheduledStart: Date;
            scheduledEnd: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            sessionType: import(".prisma/client").$Enums.SessionType;
            adminNotes: string | null;
            cancelledAt: Date | null;
            cancelReason: string | null;
            confirmedAt: Date | null;
            reminderSentAt: Date | null;
        };
    }>;
    markNoShow(id: string, user: AuthenticatedUser): Promise<{
        message: string;
        appointment: {
            id: string;
            patientId: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            therapistId: string;
            scheduledStart: Date;
            scheduledEnd: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            sessionType: import(".prisma/client").$Enums.SessionType;
            adminNotes: string | null;
            cancelledAt: Date | null;
            cancelReason: string | null;
            confirmedAt: Date | null;
            reminderSentAt: Date | null;
        };
    }>;
    cancelAppointment(id: string, dto: CancelAppointmentDto, user: AuthenticatedUser): Promise<{
        message: string;
        appointment: {
            id: string;
            patientId: string;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            therapistId: string;
            scheduledStart: Date;
            scheduledEnd: Date;
            status: import(".prisma/client").$Enums.AppointmentStatus;
            sessionType: import(".prisma/client").$Enums.SessionType;
            adminNotes: string | null;
            cancelledAt: Date | null;
            cancelReason: string | null;
            confirmedAt: Date | null;
            reminderSentAt: Date | null;
        };
    }>;
    startSession(appointmentId: string, dto: StartSessionDto, user: AuthenticatedUser): Promise<{
        message: string;
        session: {
            id: string;
            startedAt: Date;
        };
        appointmentStatus: "IN_PROGRESS";
    }>;
    endSession(sessionId: string, dto: EndSessionDto, user: AuthenticatedUser): Promise<{
        message: string;
        session: {
            id: string;
            endedAt: Date | null;
            durationMinutes: number;
        };
        appointmentStatus: "COMPLETED";
        nextAction: string;
    }>;
    signSession(sessionId: string, dto: SignSessionDto, user: AuthenticatedUser): Promise<{
        message: string;
        session: {
            id: string;
            signedAt: Date | null;
            isLocked: boolean;
        };
        signatureHash: string;
        warning: string;
    }>;
}
export {};
