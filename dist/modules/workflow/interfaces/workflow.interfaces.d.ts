import { AppointmentStatus } from '@prisma/client';
export declare const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]>;
export declare const SESSION_CREATION_ALLOWED_STATES: AppointmentStatus[];
export declare const FINAL_STATES: AppointmentStatus[];
export declare enum SessionState {
    DRAFT = "DRAFT",
    READY_TO_SIGN = "READY_TO_SIGN",
    SIGNED = "SIGNED"
}
export declare class StateTransitionError extends Error {
    readonly fromState: string;
    readonly toState: string;
    readonly resourceType: 'APPOINTMENT' | 'SESSION';
    readonly resourceId: string;
    constructor(message: string, fromState: string, toState: string, resourceType: 'APPOINTMENT' | 'SESSION', resourceId: string);
}
export interface WorkflowEvent {
    eventType: WorkflowEventType;
    resourceType: 'APPOINTMENT' | 'SESSION';
    resourceId: string;
    fromState?: string;
    toState?: string;
    actorId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare enum WorkflowEventType {
    STATE_CHANGED = "STATE_CHANGED",
    SESSION_STARTED = "SESSION_STARTED",
    SESSION_ENDED = "SESSION_ENDED",
    SESSION_SIGNED = "SESSION_SIGNED",
    SESSION_AMENDED = "SESSION_AMENDED",
    SESSION_VOIDED = "SESSION_VOIDED",
    AMENDMENT_SIGNED = "AMENDMENT_SIGNED",
    APPOINTMENT_CONFIRMED = "APPOINTMENT_CONFIRMED",
    APPOINTMENT_CANCELLED = "APPOINTMENT_CANCELLED",
    APPOINTMENT_NO_SHOW = "APPOINTMENT_NO_SHOW"
}
