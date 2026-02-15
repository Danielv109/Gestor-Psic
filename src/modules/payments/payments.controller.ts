import { Controller, Get, Post, Patch, Param, Body, Req, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class PaymentsController {
    constructor(
        private readonly payments: PaymentsService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('sessions/:sessionId/payment')
    async createPayment(
        @Param('sessionId') sessionId: string,
        @Body() dto: CreatePaymentDto,
        @Req() req: any,
    ) {
        // Get the session to find the patientId
        const session = await this.prisma.clinicalSession.findUniqueOrThrow({
            where: { id: sessionId },
            select: { patientId: true },
        });

        dto.sessionId = sessionId;
        return this.payments.createForSession(sessionId, session.patientId, dto, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }

    @Get('patients/:patientId/payments')
    async getPatientPayments(@Param('patientId') patientId: string) {
        const [payments, balance] = await Promise.all([
            this.payments.findByPatient(patientId),
            this.payments.getPatientBalance(patientId),
        ]);
        return { payments, balance };
    }

    @Get('payments/pending')
    async getPendingPayments(@Req() req: any) {
        return this.payments.findPending(req.user.sub);
    }

    @Patch('payments/:id')
    async updatePayment(
        @Param('id') id: string,
        @Body() dto: UpdatePaymentDto,
        @Req() req: any,
    ) {
        return this.payments.update(id, dto, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }
}
