// src/modules/calendar/calendar.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus, Prisma } from '@prisma/client';
import {
    CalendarEvent,
    CalendarFilters,
    AgendaRequest,
    OverlapCheckResult,
    AvailabilitySlot,
    AppointmentReminder,
    ReminderType,
    ReminderStatus,
    STATUS_COLORS,
} from './interfaces/calendar.interfaces';

/**
 * CalendarService
 * 
 * Gestión de calendario clínico para citas.
 * Todas las fechas se almacenan en UTC en la BD.
 */
@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // AGENDA QUERIES
    // ============================================================

    /**
     * Obtener agenda diaria para un terapeuta
     */
    async getDailyAgenda(
        date: Date,
        therapistId: string,
        timezone: string = 'UTC',
    ): Promise<CalendarEvent[]> {
        const startOfDay = this.startOfDay(date);
        const endOfDay = this.endOfDay(date);

        return this.getAgenda({
            startDate: startOfDay,
            endDate: endOfDay,
            timezone,
            filters: { therapistId },
        });
    }

    /**
     * Obtener agenda semanal para un terapeuta
     */
    async getWeeklyAgenda(
        weekStartDate: Date,
        therapistId: string,
        timezone: string = 'UTC',
    ): Promise<CalendarEvent[]> {
        const startOfWeek = this.startOfDay(weekStartDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        return this.getAgenda({
            startDate: startOfWeek,
            endDate: endOfWeek,
            timezone,
            filters: { therapistId },
        });
    }

    /**
     * Obtener agenda mensual
     */
    async getMonthlyAgenda(
        year: number,
        month: number, // 1-12
        therapistId?: string,
        timezone: string = 'UTC',
    ): Promise<CalendarEvent[]> {
        const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

        return this.getAgenda({
            startDate: startOfMonth,
            endDate: endOfMonth,
            timezone,
            filters: therapistId ? { therapistId } : undefined,
        });
    }

    /**
     * Query genérico de agenda con filtros
     */
    async getAgenda(request: AgendaRequest): Promise<CalendarEvent[]> {
        const { startDate, endDate, filters } = request;

        // Construir where clause
        const where: Prisma.AppointmentWhereInput = {
            scheduledStart: { gte: startDate },
            scheduledEnd: { lte: endDate },
            deletedAt: null,
        };

        if (filters?.therapistId) {
            where.therapistId = filters.therapistId;
        }

        if (filters?.patientId) {
            where.patientId = filters.patientId;
        }

        if (filters?.status && filters.status.length > 0) {
            where.status = { in: filters.status as AppointmentStatus[] };
        }

        if (filters?.sessionType) {
            where.sessionType = filters.sessionType as any;
        }

        const appointments = await this.prisma.appointment.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                session: {
                    select: { id: true },
                },
            },
            orderBy: { scheduledStart: 'asc' },
        });

        // Transformar a eventos de calendario
        return appointments.map((apt) => this.toCalendarEvent(apt));
    }

    // ============================================================
    // OVERLAP VALIDATION
    // ============================================================

    /**
     * Verificar solapamiento de citas para un terapeuta
     */
    async checkOverlap(
        therapistId: string,
        startTime: Date,
        endTime: Date,
        excludeAppointmentId?: string,
    ): Promise<OverlapCheckResult> {
        // Buscar citas que se solapan
        const overlapping = await this.prisma.appointment.findMany({
            where: {
                therapistId,
                deletedAt: null,
                status: {
                    notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
                },
                // Solapamiento: (start1 < end2) AND (end1 > start2)
                AND: [
                    { scheduledStart: { lt: endTime } },
                    { scheduledEnd: { gt: startTime } },
                ],
                ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
            },
            include: {
                patient: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return {
            hasOverlap: overlapping.length > 0,
            conflicts: overlapping.map((apt) => ({
                appointmentId: apt.id,
                patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
                scheduledStart: apt.scheduledStart,
                scheduledEnd: apt.scheduledEnd,
            })),
        };
    }

    /**
     * Validar y lanzar error si hay solapamiento
     */
    async validateNoOverlap(
        therapistId: string,
        startTime: Date,
        endTime: Date,
        excludeAppointmentId?: string,
    ): Promise<void> {
        const result = await this.checkOverlap(
            therapistId,
            startTime,
            endTime,
            excludeAppointmentId,
        );

        if (result.hasOverlap) {
            const conflictInfo = result.conflicts
                .map((c) => `${c.patientName} (${this.formatTime(c.scheduledStart)} - ${this.formatTime(c.scheduledEnd)})`)
                .join(', ');

            throw new BadRequestException(
                `Conflicto de horario con: ${conflictInfo}`,
            );
        }
    }

    // ============================================================
    // AVAILABILITY
    // ============================================================

    /**
     * Obtener slots disponibles para un terapeuta en un día
     */
    async getAvailableSlots(
        therapistId: string,
        date: Date,
        slotDurationMinutes: number = 60,
        workdayStart: number = 9,  // 9 AM
        workdayEnd: number = 18,   // 6 PM
    ): Promise<AvailabilitySlot[]> {
        const dayStart = this.startOfDay(date);
        const dayEnd = this.endOfDay(date);

        // Obtener citas existentes
        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                therapistId,
                scheduledStart: { gte: dayStart },
                scheduledEnd: { lte: dayEnd },
                status: {
                    notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
                },
                deletedAt: null,
            },
            orderBy: { scheduledStart: 'asc' },
        });

        const slots: AvailabilitySlot[] = [];
        const slotMs = slotDurationMinutes * 60 * 1000;

        // Generar slots
        for (let hour = workdayStart; hour < workdayEnd; hour++) {
            const slotStart = new Date(dayStart);
            slotStart.setUTCHours(hour, 0, 0, 0);

            const slotEnd = new Date(slotStart.getTime() + slotMs);

            // Verificar si hay solapamiento con citas existentes
            const isOccupied = existingAppointments.some((apt) => {
                const aptStart = apt.scheduledStart.getTime();
                const aptEnd = apt.scheduledEnd.getTime();
                const sStart = slotStart.getTime();
                const sEnd = slotEnd.getTime();
                return sStart < aptEnd && sEnd > aptStart;
            });

            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                available: !isOccupied,
            });
        }

        return slots;
    }

    // ============================================================
    // REMINDERS (Simulado)
    // ============================================================

    /**
     * Obtener citas que necesitan recordatorio
     */
    async getAppointmentsNeedingReminder(
        hoursAhead: number = 24,
    ): Promise<AppointmentReminder[]> {
        const now = new Date();
        const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

        const appointments = await this.prisma.appointment.findMany({
            where: {
                scheduledStart: {
                    gte: now,
                    lte: cutoff,
                },
                status: {
                    in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
                },
                deletedAt: null,
                // En una implementación real, filtraríamos los ya enviados
            },
        });

        return appointments.map((apt) => ({
            appointmentId: apt.id,
            patientId: apt.patientId,
            therapistId: apt.therapistId,
            scheduledAt: apt.scheduledStart,
            reminderType: hoursAhead >= 24 ? ReminderType.EMAIL_24H : ReminderType.EMAIL_1H,
            status: ReminderStatus.PENDING,
        }));
    }

    /**
     * Simular envío de recordatorio
     */
    async sendReminder(reminder: AppointmentReminder): Promise<{
        success: boolean;
        message: string;
    }> {
        // Simulación - en producción se integraría con servicio de email/SMS
        this.logger.log(
            `[SIMULATED] Sending ${reminder.reminderType} reminder for appointment ${reminder.appointmentId}`,
        );

        // Simular delay de envío
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
            success: true,
            message: `Recordatorio ${reminder.reminderType} enviado (simulado)`,
        };
    }

    /**
     * Procesar batch de recordatorios
     */
    async processReminders(): Promise<{
        processed: number;
        sent: number;
        failed: number;
    }> {
        const reminders24h = await this.getAppointmentsNeedingReminder(24);
        const reminders1h = await this.getAppointmentsNeedingReminder(1);

        // Combinar y deduplicar
        const allReminders = [...reminders24h, ...reminders1h];
        const uniqueReminders = allReminders.filter(
            (r, i, arr) => arr.findIndex((x) => x.appointmentId === r.appointmentId) === i,
        );

        let sent = 0;
        let failed = 0;

        for (const reminder of uniqueReminders) {
            const result = await this.sendReminder(reminder);
            if (result.success) {
                sent++;
            } else {
                failed++;
            }
        }

        return {
            processed: uniqueReminders.length,
            sent,
            failed,
        };
    }

    // ============================================================
    // HELPERS
    // ============================================================

    /**
     * Transformar cita a evento de calendario FullCalendar
     */
    private toCalendarEvent(appointment: any): CalendarEvent {
        const statusColors = STATUS_COLORS[appointment.status] || STATUS_COLORS.SCHEDULED;
        const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
        const therapistName = `${appointment.therapist.firstName} ${appointment.therapist.lastName}`;

        return {
            id: appointment.id,
            title: patientName,
            start: appointment.scheduledStart.toISOString(),
            end: appointment.scheduledEnd.toISOString(),
            extendedProps: {
                appointmentId: appointment.id,
                patientId: appointment.patientId,
                patientName,
                therapistId: appointment.therapistId,
                therapistName,
                sessionType: appointment.sessionType,
                status: appointment.status,
                hasSession: !!appointment.session,
            },
            backgroundColor: statusColors.bg,
            borderColor: statusColors.border,
            textColor: statusColors.text,
            classNames: [
                `appointment-${appointment.status.toLowerCase()}`,
                appointment.session ? 'has-session' : 'no-session',
            ],
        };
    }

    private startOfDay(date: Date): Date {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }

    private endOfDay(date: Date): Date {
        const d = new Date(date);
        d.setUTCHours(23, 59, 59, 999);
        return d;
    }

    private formatTime(date: Date): string {
        return date.toISOString().substring(11, 16);
    }
}
