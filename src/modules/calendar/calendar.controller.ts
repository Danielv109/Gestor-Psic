// src/modules/calendar/calendar.controller.ts
import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    Body,
    ParseUUIDPipe,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';

// DTOs
class CheckOverlapDto {
    startTime: string; // ISO 8601
    endTime: string;
    excludeAppointmentId?: string;
}

class AgendaQueryDto {
    therapistId?: string;
    patientId?: string;
    status?: string; // comma-separated
    sessionType?: string;
    timezone?: string;
}

@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) { }

    // ============================================================
    // AGENDA ENDPOINTS
    // ============================================================

    /**
     * GET /calendar/daily?date=2026-02-03&therapistId=...
     * Agenda diaria
     */
    @Get('daily')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getDailyAgenda(
        @Query('date') dateStr: string,
        @Query('therapistId') therapistId: string,
        @Query('timezone') timezone?: string,
        @CurrentUser() user?: AuthenticatedUser,
    ) {
        const date = new Date(dateStr);
        const tId = therapistId || user?.id;

        if (!tId) {
            throw new Error('therapistId is required');
        }

        const events = await this.calendarService.getDailyAgenda(
            date,
            tId,
            timezone,
        );

        return {
            date: dateStr,
            therapistId: tId,
            count: events.length,
            events,
        };
    }

    /**
     * GET /calendar/weekly?weekStart=2026-02-03&therapistId=...
     * Agenda semanal
     */
    @Get('weekly')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getWeeklyAgenda(
        @Query('weekStart') weekStartStr: string,
        @Query('therapistId') therapistId: string,
        @Query('timezone') timezone?: string,
        @CurrentUser() user?: AuthenticatedUser,
    ) {
        const weekStart = new Date(weekStartStr);
        const tId = therapistId || user?.id;

        if (!tId) {
            throw new Error('therapistId is required');
        }

        const events = await this.calendarService.getWeeklyAgenda(
            weekStart,
            tId,
            timezone,
        );

        return {
            weekStart: weekStartStr,
            weekEnd: new Date(
                weekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
            ).toISOString().split('T')[0],
            therapistId: tId,
            count: events.length,
            events,
        };
    }

    /**
     * GET /calendar/monthly?year=2026&month=2&therapistId=...
     * Agenda mensual
     */
    @Get('monthly')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getMonthlyAgenda(
        @Query('year', ParseIntPipe) year: number,
        @Query('month', ParseIntPipe) month: number,
        @Query('therapistId') therapistId?: string,
        @Query('timezone') timezone?: string,
    ) {
        const events = await this.calendarService.getMonthlyAgenda(
            year,
            month,
            therapistId,
            timezone,
        );

        return {
            year,
            month,
            therapistId: therapistId || 'all',
            count: events.length,
            events,
        };
    }

    /**
     * GET /calendar/range?start=...&end=...&filters...
     * Agenda por rango con filtros
     */
    @Get('range')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getAgendaByRange(
        @Query('start') startStr: string,
        @Query('end') endStr: string,
        @Query() query: AgendaQueryDto,
    ) {
        const events = await this.calendarService.getAgenda({
            startDate: new Date(startStr),
            endDate: new Date(endStr),
            timezone: query.timezone,
            filters: {
                therapistId: query.therapistId,
                patientId: query.patientId,
                status: query.status?.split(','),
                sessionType: query.sessionType,
            },
        });

        return {
            start: startStr,
            end: endStr,
            filters: query,
            count: events.length,
            events,
        };
    }

    // ============================================================
    // OVERLAP VALIDATION
    // ============================================================

    /**
     * POST /calendar/check-overlap
     * Verificar solapamiento de citas
     */
    @Post('check-overlap')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @HttpCode(HttpStatus.OK)
    async checkOverlap(
        @Body() dto: CheckOverlapDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const result = await this.calendarService.checkOverlap(
            user.id,
            new Date(dto.startTime),
            new Date(dto.endTime),
            dto.excludeAppointmentId,
        );

        return {
            therapistId: user.id,
            requestedSlot: {
                start: dto.startTime,
                end: dto.endTime,
            },
            ...result,
        };
    }

    // ============================================================
    // AVAILABILITY
    // ============================================================

    /**
     * GET /calendar/availability/:therapistId?date=...
     * Obtener slots disponibles
     */
    @Get('availability/:therapistId')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getAvailability(
        @Param('therapistId', ParseUUIDPipe) therapistId: string,
        @Query('date') dateStr: string,
        @Query('slotDuration') slotDuration?: string,
        @Query('workdayStart') workdayStart?: string,
        @Query('workdayEnd') workdayEnd?: string,
    ) {
        const date = new Date(dateStr);
        const slots = await this.calendarService.getAvailableSlots(
            therapistId,
            date,
            slotDuration ? parseInt(slotDuration, 10) : 60,
            workdayStart ? parseInt(workdayStart, 10) : 9,
            workdayEnd ? parseInt(workdayEnd, 10) : 18,
        );

        const availableSlots = slots.filter((s) => s.available);
        const occupiedSlots = slots.filter((s) => !s.available);

        return {
            therapistId,
            date: dateStr,
            totalSlots: slots.length,
            availableCount: availableSlots.length,
            occupiedCount: occupiedSlots.length,
            slots,
        };
    }

    // ============================================================
    // REMINDERS
    // ============================================================

    /**
     * GET /calendar/reminders/pending
     * Obtener citas pendientes de recordatorio
     */
    @Get('reminders/pending')
    @Roles(GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getPendingReminders(@Query('hoursAhead') hoursAhead?: string) {
        const hours = hoursAhead ? parseInt(hoursAhead, 10) : 24;
        const reminders = await this.calendarService.getAppointmentsNeedingReminder(hours);

        return {
            hoursAhead: hours,
            count: reminders.length,
            reminders,
        };
    }

    /**
     * POST /calendar/reminders/process
     * Procesar y enviar recordatorios (simulado)
     */
    @Post('reminders/process')
    @Roles(GlobalRole.SUPERVISOR)
    @HttpCode(HttpStatus.OK)
    async processReminders() {
        const result = await this.calendarService.processReminders();

        return {
            message: 'Recordatorios procesados',
            ...result,
        };
    }

    /**
     * POST /calendar/reminders/send/:appointmentId
     * Enviar recordatorio individual (simulado)
     */
    @Post('reminders/send/:appointmentId')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @HttpCode(HttpStatus.OK)
    async sendSingleReminder(
        @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
        @Query('type') reminderType?: string,
    ) {
        const reminders = await this.calendarService.getAppointmentsNeedingReminder(168); // 1 week
        const reminder = reminders.find((r) => r.appointmentId === appointmentId);

        if (!reminder) {
            return {
                success: false,
                message: 'Cita no encontrada o no requiere recordatorio',
            };
        }

        const result = await this.calendarService.sendReminder(reminder);

        return {
            appointmentId,
            ...result,
        };
    }
}
