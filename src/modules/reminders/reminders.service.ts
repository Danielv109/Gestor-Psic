import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Cron job that runs daily at 6:00 PM to send reminders for tomorrow's appointments.
     * Currently logs reminders — ready for email/WhatsApp integration.
     */
    @Cron('0 18 * * *', { name: 'appointment-reminders' })
    async sendDailyReminders() {
        this.logger.log('🔔 Ejecutando recordatorios diarios...');
        const results = await this.processReminders();
        this.logger.log(`✅ Recordatorios completados: ${results.sent} enviados, ${results.skipped} omitidos`);
        return results;
    }

    /**
     * Process reminders manually (also called by the cron job).
     */
    async processReminders() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        // Find tomorrow's appointments that haven't been reminded yet
        const appointments = await this.prisma.appointment.findMany({
            where: {
                scheduledStart: { gte: tomorrow, lt: dayAfter },
                status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
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
        const reminders: any[] = [];

        for (const appt of appointments) {
            const patient = appt.patient;
            const channels: string[] = [];

            if (patient.contactEmail) {
                // TODO: Integrate with Resend/SendGrid
                this.logger.log(
                    `📧 [PLACEHOLDER] Email → ${patient.contactEmail}: ` +
                    `Recordatorio de cita mañana ${appt.scheduledStart.toLocaleString('es-MX')} ` +
                    `con ${appt.therapist.firstName} ${appt.therapist.lastName}`,
                );
                channels.push('email');
            }

            if (patient.contactPhone) {
                // TODO: Integrate with Twilio/WhatsApp Business API
                this.logger.log(
                    `📱 [PLACEHOLDER] WhatsApp → ${patient.contactPhone}: ` +
                    `Recordatorio de cita mañana ${appt.scheduledStart.toLocaleString('es-MX')}`,
                );
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
            } else {
                this.logger.warn(
                    `⚠️ Paciente ${patient.firstName} ${patient.lastName} sin datos de contacto — omitido`,
                );
                skipped++;
            }
        }

        return { sent, skipped, total: appointments.length, reminders };
    }
}
