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
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let RemindersService = RemindersService_1 = class RemindersService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RemindersService_1.name);
    }
    async sendDailyReminders() {
        this.logger.log('🔔 Ejecutando recordatorios diarios...');
        const results = await this.processReminders();
        this.logger.log(`✅ Recordatorios completados: ${results.sent} enviados, ${results.skipped} omitidos`);
        return results;
    }
    async processReminders() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const appointments = await this.prisma.appointment.findMany({
            where: {
                scheduledStart: { gte: tomorrow, lt: dayAfter },
                status: { in: [client_1.AppointmentStatus.SCHEDULED, client_1.AppointmentStatus.CONFIRMED] },
                reminderSentAt: null,
                deletedAt: null,
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        contactEmail: true,
                        contactPhone: true,
                    },
                },
                therapist: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
        let sent = 0;
        let skipped = 0;
        const reminders = [];
        for (const appt of appointments) {
            const patient = appt.patient;
            const channels = [];
            if (patient.contactEmail) {
                this.logger.log(`📧 [PLACEHOLDER] Email → ${patient.contactEmail}: ` +
                    `Recordatorio de cita mañana ${appt.scheduledStart.toLocaleString('es-MX')} ` +
                    `con ${appt.therapist.firstName} ${appt.therapist.lastName}`);
                channels.push('email');
            }
            if (patient.contactPhone) {
                this.logger.log(`📱 [PLACEHOLDER] WhatsApp → ${patient.contactPhone}: ` +
                    `Recordatorio de cita mañana ${appt.scheduledStart.toLocaleString('es-MX')}`);
                channels.push('whatsapp');
            }
            if (channels.length > 0) {
                await this.prisma.appointment.update({
                    where: { id: appt.id },
                    data: { reminderSentAt: new Date() },
                });
                sent++;
                reminders.push({
                    appointmentId: appt.id,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    scheduledStart: appt.scheduledStart,
                    channels,
                });
            }
            else {
                this.logger.warn(`⚠️ Paciente ${patient.firstName} ${patient.lastName} sin datos de contacto — omitido`);
                skipped++;
            }
        }
        return { sent, skipped, total: appointments.length, reminders };
    }
};
exports.RemindersService = RemindersService;
__decorate([
    (0, schedule_1.Cron)('0 18 * * *', { name: 'appointment-reminders' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "sendDailyReminders", null);
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map