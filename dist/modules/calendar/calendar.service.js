"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const calendar_interfaces_1 = require("./interfaces/calendar.interfaces");
let CalendarService = CalendarService_1 = class CalendarService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CalendarService_1.name);
    }
    async getDailyAgenda(date, therapistId, timezone = 'UTC') {
        const startOfDay = this.startOfDay(date);
        const endOfDay = this.endOfDay(date);
        return this.getAgenda({
            startDate: startOfDay,
            endDate: endOfDay,
            timezone,
            filters: { therapistId },
        });
    }
    async getWeeklyAgenda(weekStartDate, therapistId, timezone = 'UTC') {
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
    async getMonthlyAgenda(year, month, therapistId, timezone = 'UTC') {
        const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        return this.getAgenda({
            startDate: startOfMonth,
            endDate: endOfMonth,
            timezone,
            filters: therapistId ? { therapistId } : undefined,
        });
    }
    async getAgenda(request) {
        const { startDate, endDate, filters } = request;
        const where = {
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
            where.status = { in: filters.status };
        }
        if (filters?.sessionType) {
            where.sessionType = filters.sessionType;
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
        return appointments.map((apt) => this.toCalendarEvent(apt));
    }
    async checkOverlap(therapistId, startTime, endTime, excludeAppointmentId) {
        const overlapping = await this.prisma.appointment.findMany({
            where: {
                therapistId,
                deletedAt: null,
                status: {
                    notIn: [client_1.AppointmentStatus.CANCELLED, client_1.AppointmentStatus.NO_SHOW],
                },
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
    async validateNoOverlap(therapistId, startTime, endTime, excludeAppointmentId) {
        const result = await this.checkOverlap(therapistId, startTime, endTime, excludeAppointmentId);
        if (result.hasOverlap) {
            const conflictInfo = result.conflicts
                .map((c) => `${c.patientName} (${this.formatTime(c.scheduledStart)} - ${this.formatTime(c.scheduledEnd)})`)
                .join(', ');
            throw new common_1.BadRequestException(`Conflicto de horario con: ${conflictInfo}`);
        }
    }
    async getAvailableSlots(therapistId, date, slotDurationMinutes = 60, workdayStart = 9, workdayEnd = 18) {
        const dayStart = this.startOfDay(date);
        const dayEnd = this.endOfDay(date);
        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                therapistId,
                scheduledStart: { gte: dayStart },
                scheduledEnd: { lte: dayEnd },
                status: {
                    notIn: [client_1.AppointmentStatus.CANCELLED, client_1.AppointmentStatus.NO_SHOW],
                },
                deletedAt: null,
            },
            orderBy: { scheduledStart: 'asc' },
        });
        const slots = [];
        const slotMs = slotDurationMinutes * 60 * 1000;
        for (let hour = workdayStart; hour < workdayEnd; hour++) {
            const slotStart = new Date(dayStart);
            slotStart.setUTCHours(hour, 0, 0, 0);
            const slotEnd = new Date(slotStart.getTime() + slotMs);
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
    async getAppointmentsNeedingReminder(hoursAhead = 24) {
        const now = new Date();
        const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
        const appointments = await this.prisma.appointment.findMany({
            where: {
                scheduledStart: {
                    gte: now,
                    lte: cutoff,
                },
                status: {
                    in: [client_1.AppointmentStatus.SCHEDULED, client_1.AppointmentStatus.CONFIRMED],
                },
                deletedAt: null,
            },
        });
        return appointments.map((apt) => ({
            appointmentId: apt.id,
            patientId: apt.patientId,
            therapistId: apt.therapistId,
            scheduledAt: apt.scheduledStart,
            reminderType: hoursAhead >= 24 ? calendar_interfaces_1.ReminderType.EMAIL_24H : calendar_interfaces_1.ReminderType.EMAIL_1H,
            status: calendar_interfaces_1.ReminderStatus.PENDING,
        }));
    }
    async sendReminder(reminder) {
        this.logger.log(`[SIMULATED] Sending ${reminder.reminderType} reminder for appointment ${reminder.appointmentId}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
            success: true,
            message: `Recordatorio ${reminder.reminderType} enviado (simulado)`,
        };
    }
    async processReminders() {
        const reminders24h = await this.getAppointmentsNeedingReminder(24);
        const reminders1h = await this.getAppointmentsNeedingReminder(1);
        const allReminders = [...reminders24h, ...reminders1h];
        const uniqueReminders = allReminders.filter((r, i, arr) => arr.findIndex((x) => x.appointmentId === r.appointmentId) === i);
        let sent = 0;
        let failed = 0;
        for (const reminder of uniqueReminders) {
            const result = await this.sendReminder(reminder);
            if (result.success) {
                sent++;
            }
            else {
                failed++;
            }
        }
        return {
            processed: uniqueReminders.length,
            sent,
            failed,
        };
    }
    toCalendarEvent(appointment) {
        const statusColors = calendar_interfaces_1.STATUS_COLORS[appointment.status] || calendar_interfaces_1.STATUS_COLORS.SCHEDULED;
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
    startOfDay(date) {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0);
        return d;
    }
    endOfDay(date) {
        const d = new Date(date);
        d.setUTCHours(23, 59, 59, 999);
        return d;
    }
    formatTime(date) {
        return date.toISOString().substring(11, 16);
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map