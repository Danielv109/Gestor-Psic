// src/modules/calendar/interfaces/calendar.interfaces.ts

/**
 * Interfaces para el módulo de calendario clínico
 */

/**
 * Evento de calendario compatible con FullCalendar
 */
export interface CalendarEvent {
    id: string;
    title: string;
    start: string; // ISO 8601
    end: string;   // ISO 8601

    // FullCalendar extended props
    extendedProps: {
        appointmentId: string;
        patientId: string;
        patientName: string;
        therapistId: string;
        therapistName: string;
        sessionType: string;
        status: string;
        hasSession: boolean;
    };

    // Styling
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    classNames?: string[];
}

/**
 * Filtros para queries de calendario
 */
export interface CalendarFilters {
    therapistId?: string;
    patientId?: string;
    status?: string[];
    sessionType?: string;
}

/**
 * Solicitud de agenda
 */
export interface AgendaRequest {
    startDate: Date;
    endDate: Date;
    timezone?: string;
    filters?: CalendarFilters;
}

/**
 * Resultado de verificación de solapamiento
 */
export interface OverlapCheckResult {
    hasOverlap: boolean;
    conflicts: {
        appointmentId: string;
        patientName: string;
        scheduledStart: Date;
        scheduledEnd: Date;
    }[];
}

/**
 * Slot de disponibilidad
 */
export interface AvailabilitySlot {
    start: string;
    end: string;
    available: boolean;
}

/**
 * Recordatorio de cita
 */
export interface AppointmentReminder {
    appointmentId: string;
    patientId: string;
    therapistId: string;
    scheduledAt: Date;
    reminderType: ReminderType;
    status: ReminderStatus;
    sentAt?: Date;
}

export enum ReminderType {
    EMAIL_24H = 'EMAIL_24H',
    EMAIL_1H = 'EMAIL_1H',
    SMS_24H = 'SMS_24H',
    SMS_1H = 'SMS_1H',
    PUSH = 'PUSH',
}

export enum ReminderStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
}

/**
 * Colores por estado de cita
 */
export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    SCHEDULED: { bg: '#3788d8', border: '#2c6cb0', text: '#ffffff' },
    CONFIRMED: { bg: '#28a745', border: '#1e7e34', text: '#ffffff' },
    IN_PROGRESS: { bg: '#ffc107', border: '#d39e00', text: '#212529' },
    COMPLETED: { bg: '#6c757d', border: '#545b62', text: '#ffffff' },
    CANCELLED: { bg: '#dc3545', border: '#bd2130', text: '#ffffff' },
    NO_SHOW: { bg: '#17a2b8', border: '#117a8b', text: '#ffffff' },
};
