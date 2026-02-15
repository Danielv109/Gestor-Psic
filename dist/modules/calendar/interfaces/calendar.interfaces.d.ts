export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
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
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    classNames?: string[];
}
export interface CalendarFilters {
    therapistId?: string;
    patientId?: string;
    status?: string[];
    sessionType?: string;
}
export interface AgendaRequest {
    startDate: Date;
    endDate: Date;
    timezone?: string;
    filters?: CalendarFilters;
}
export interface OverlapCheckResult {
    hasOverlap: boolean;
    conflicts: {
        appointmentId: string;
        patientName: string;
        scheduledStart: Date;
        scheduledEnd: Date;
    }[];
}
export interface AvailabilitySlot {
    start: string;
    end: string;
    available: boolean;
}
export interface AppointmentReminder {
    appointmentId: string;
    patientId: string;
    therapistId: string;
    scheduledAt: Date;
    reminderType: ReminderType;
    status: ReminderStatus;
    sentAt?: Date;
}
export declare enum ReminderType {
    EMAIL_24H = "EMAIL_24H",
    EMAIL_1H = "EMAIL_1H",
    SMS_24H = "SMS_24H",
    SMS_1H = "SMS_1H",
    PUSH = "PUSH"
}
export declare enum ReminderStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED",
    SKIPPED = "SKIPPED"
}
export declare const STATUS_COLORS: Record<string, {
    bg: string;
    border: string;
    text: string;
}>;
