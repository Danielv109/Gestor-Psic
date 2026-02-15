import { PrismaService } from '../../prisma/prisma.service';
import { CalendarEvent, AgendaRequest, OverlapCheckResult, AvailabilitySlot, AppointmentReminder } from './interfaces/calendar.interfaces';
export declare class CalendarService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDailyAgenda(date: Date, therapistId: string, timezone?: string): Promise<CalendarEvent[]>;
    getWeeklyAgenda(weekStartDate: Date, therapistId: string, timezone?: string): Promise<CalendarEvent[]>;
    getMonthlyAgenda(year: number, month: number, therapistId?: string, timezone?: string): Promise<CalendarEvent[]>;
    getAgenda(request: AgendaRequest): Promise<CalendarEvent[]>;
    checkOverlap(therapistId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<OverlapCheckResult>;
    validateNoOverlap(therapistId: string, startTime: Date, endTime: Date, excludeAppointmentId?: string): Promise<void>;
    getAvailableSlots(therapistId: string, date: Date, slotDurationMinutes?: number, workdayStart?: number, workdayEnd?: number): Promise<AvailabilitySlot[]>;
    getAppointmentsNeedingReminder(hoursAhead?: number): Promise<AppointmentReminder[]>;
    sendReminder(reminder: AppointmentReminder): Promise<{
        success: boolean;
        message: string;
    }>;
    processReminders(): Promise<{
        processed: number;
        sent: number;
        failed: number;
    }>;
    private toCalendarEvent;
    private startOfDay;
    private endOfDay;
    private formatTime;
}
