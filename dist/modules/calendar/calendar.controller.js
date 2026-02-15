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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const calendar_service_1 = require("./calendar.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
class CheckOverlapDto {
}
class AgendaQueryDto {
}
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async getDailyAgenda(dateStr, therapistId, timezone, user) {
        const date = new Date(dateStr);
        const tId = therapistId || user?.id;
        if (!tId) {
            throw new Error('therapistId is required');
        }
        const events = await this.calendarService.getDailyAgenda(date, tId, timezone);
        return {
            date: dateStr,
            therapistId: tId,
            count: events.length,
            events,
        };
    }
    async getWeeklyAgenda(weekStartStr, therapistId, timezone, user) {
        const weekStart = new Date(weekStartStr);
        const tId = therapistId || user?.id;
        if (!tId) {
            throw new Error('therapistId is required');
        }
        const events = await this.calendarService.getWeeklyAgenda(weekStart, tId, timezone);
        return {
            weekStart: weekStartStr,
            weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            therapistId: tId,
            count: events.length,
            events,
        };
    }
    async getMonthlyAgenda(year, month, therapistId, timezone) {
        const events = await this.calendarService.getMonthlyAgenda(year, month, therapistId, timezone);
        return {
            year,
            month,
            therapistId: therapistId || 'all',
            count: events.length,
            events,
        };
    }
    async getAgendaByRange(startStr, endStr, query) {
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
    async checkOverlap(dto, user) {
        const result = await this.calendarService.checkOverlap(user.id, new Date(dto.startTime), new Date(dto.endTime), dto.excludeAppointmentId);
        return {
            therapistId: user.id,
            requestedSlot: {
                start: dto.startTime,
                end: dto.endTime,
            },
            ...result,
        };
    }
    async getAvailability(therapistId, dateStr, slotDuration, workdayStart, workdayEnd) {
        const date = new Date(dateStr);
        const slots = await this.calendarService.getAvailableSlots(therapistId, date, slotDuration ? parseInt(slotDuration, 10) : 60, workdayStart ? parseInt(workdayStart, 10) : 9, workdayEnd ? parseInt(workdayEnd, 10) : 18);
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
    async getPendingReminders(hoursAhead) {
        const hours = hoursAhead ? parseInt(hoursAhead, 10) : 24;
        const reminders = await this.calendarService.getAppointmentsNeedingReminder(hours);
        return {
            hoursAhead: hours,
            count: reminders.length,
            reminders,
        };
    }
    async processReminders() {
        const result = await this.calendarService.processReminders();
        return {
            message: 'Recordatorios procesados',
            ...result,
        };
    }
    async sendSingleReminder(appointmentId, reminderType) {
        const reminders = await this.calendarService.getAppointmentsNeedingReminder(168);
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
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)('daily'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('therapistId')),
    __param(2, (0, common_1.Query)('timezone')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getDailyAgenda", null);
__decorate([
    (0, common_1.Get)('weekly'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Query)('weekStart')),
    __param(1, (0, common_1.Query)('therapistId')),
    __param(2, (0, common_1.Query)('timezone')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getWeeklyAgenda", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Query)('year', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('month', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('therapistId')),
    __param(3, (0, common_1.Query)('timezone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getMonthlyAgenda", null);
__decorate([
    (0, common_1.Get)('range'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, AgendaQueryDto]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getAgendaByRange", null);
__decorate([
    (0, common_1.Post)('check-overlap'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckOverlapDto, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "checkOverlap", null);
__decorate([
    (0, common_1.Get)('availability/:therapistId'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Param)('therapistId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('slotDuration')),
    __param(3, (0, common_1.Query)('workdayStart')),
    __param(4, (0, common_1.Query)('workdayEnd')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)('reminders/pending'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Query)('hoursAhead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getPendingReminders", null);
__decorate([
    (0, common_1.Post)('reminders/process'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.SUPERVISOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "processReminders", null);
__decorate([
    (0, common_1.Post)('reminders/send/:appointmentId'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('appointmentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "sendSingleReminder", null);
exports.CalendarController = CalendarController = __decorate([
    (0, common_1.Controller)('calendar'),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map