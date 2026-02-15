// src/modules/workflow/interfaces/workflow.interfaces.ts
import { AppointmentStatus } from '@prisma/client';

/**
 * Transiciones válidas de estado de cita
 * 
 * SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
 *     ↓           ↓
 * CANCELLED   CANCELLED
 *     ↓
 *  NO_SHOW
 */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    [AppointmentStatus.SCHEDULED]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.CANCELLED,
    ],
    [AppointmentStatus.IN_PROGRESS]: [
        AppointmentStatus.COMPLETED,
        // No se puede cancelar una vez iniciada
    ],
    [AppointmentStatus.COMPLETED]: [
        // Estado final - sin transiciones
    ],
    [AppointmentStatus.CANCELLED]: [
        // Estado final - sin transiciones
    ],
    [AppointmentStatus.NO_SHOW]: [
        // Estado final - sin transiciones
    ],
};

/**
 * Estados que permiten crear una sesión clínica
 */
export const SESSION_CREATION_ALLOWED_STATES: AppointmentStatus[] = [
    AppointmentStatus.CONFIRMED,
];

/**
 * Estados finales (no modificables)
 */
export const FINAL_STATES: AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
];

/**
 * Estados de sesión clínica
 */
export enum SessionState {
    DRAFT = 'DRAFT',           // En edición
    READY_TO_SIGN = 'READY_TO_SIGN', // Completa, lista para firmar
    SIGNED = 'SIGNED',         // Firmada e inmutable
}

/**
 * Error de transición de estado
 */
export class StateTransitionError extends Error {
    constructor(
        message: string,
        public readonly fromState: string,
        public readonly toState: string,
        public readonly resourceType: 'APPOINTMENT' | 'SESSION',
        public readonly resourceId: string,
    ) {
        super(message);
        this.name = 'StateTransitionError';
    }
}

/**
 * Evento de workflow para auditoría
 */
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

export enum WorkflowEventType {
    STATE_CHANGED = 'STATE_CHANGED',
    SESSION_STARTED = 'SESSION_STARTED',
    SESSION_ENDED = 'SESSION_ENDED',
    SESSION_SIGNED = 'SESSION_SIGNED',
    SESSION_AMENDED = 'SESSION_AMENDED',
    SESSION_VOIDED = 'SESSION_VOIDED',
    AMENDMENT_SIGNED = 'AMENDMENT_SIGNED',
    APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
    APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
    APPOINTMENT_NO_SHOW = 'APPOINTMENT_NO_SHOW',
}
