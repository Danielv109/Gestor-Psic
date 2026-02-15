import { CalendarService } from './calendar.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
declare class CheckOverlapDto {
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
}
declare class AgendaQueryDto {
    therapistId?: string;
    patientId?: string;
    status?: string;
    sessionType?: string;
    timezone?: string;
}
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getDailyAgenda(dateStr: string, therapistId: string, timezone?: string, user?: AuthenticatedUser): Promise<{
        date: string;
        therapistId: string;
        count: number;
        events: import(".").CalendarEvent[];
    }>;
    getWeeklyAgenda(weekStartStr: string, therapistId: string, timezone?: string, user?: AuthenticatedUser): Promise<{
        weekStart: string;
        weekEnd: string;
        therapistId: string;
        count: number;
        events: import(".").CalendarEvent[];
    }>;
    getMonthlyAgenda(year: number, month: number, therapistId?: string, timezone?: string): Promise<{
        year: number;
        month: number;
        therapistId: string;
        count: number;
        events: import(".").CalendarEvent[];
    }>;
    getAgendaByRange(startStr: string, endStr: string, query: AgendaQueryDto): Promise<{
        start: string;
        end: string;
        filters: AgendaQueryDto;
        count: number;
        events: import(".").CalendarEvent[];
    }>;
    checkOverlap(dto: CheckOverlapDto, user: AuthenticatedUser): Promise<{
        hasOverlap: boolean;
        conflicts: {
            appointmentId: string;
            patientName: string;
            scheduledStart: Date;
            scheduledEnd: Date;
        }[];
        therapistId: string;
        requestedSlot: {
            start: string;
            end: string;
        };
    }>;
    getAvailability(therapistId: string, dateStr: string, slotDuration?: string, workdayStart?: string, workdayEnd?: string): Promise<{
        therapistId: string;
        date: string;
        totalSlots: number;
        availableCount: number;
        occupiedCount: number;
        slots: import(".").AvailabilitySlot[];
    }>;
    getPendingReminders(hoursAhead?: string): Promise<{
        hoursAhead: number;
        count: number;
        reminders: import(".").AppointmentReminder[];
    }>;
    processReminders(): Promise<{
        processed: number;
        sent: number;
        failed: number;
        message: string;
    }>;
    sendSingleReminder(appointmentId: string, reminderType?: string): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message: string;
        appointmentId: string;
    }>;
}
export {};
