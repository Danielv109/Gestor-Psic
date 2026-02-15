import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class PaymentsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.SessionPaymentUncheckedCreateInput) {
        return this.prisma.sessionPayment.create({ data });
    }

    async findById(id: string) {
        return this.prisma.sessionPayment.findUnique({
            where: { id },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, externalId: true } },
                session: { select: { id: true, startedAt: true, appointmentId: true } },
            },
        });
    }

    async findBySessionId(sessionId: string) {
        return this.prisma.sessionPayment.findUnique({
            where: { sessionId },
        });
    }

    async findByPatientId(patientId: string) {
        return this.prisma.sessionPayment.findMany({
            where: { patientId },
            include: {
                session: { select: { id: true, startedAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findPending(therapistId?: string) {
        const where: Prisma.SessionPaymentWhereInput = {
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] },
        };
        if (therapistId) where.therapistId = therapistId;

        return this.prisma.sessionPayment.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, externalId: true } },
                session: { select: { id: true, startedAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: string, data: Prisma.SessionPaymentUncheckedUpdateInput) {
        return this.prisma.sessionPayment.update({ where: { id }, data });
    }

    async getPatientBalance(patientId: string) {
        const result = await this.prisma.sessionPayment.aggregate({
            where: { patientId, status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL] } },
            _sum: { amount: true, amountPaid: true },
            _count: true,
        });
        const totalOwed = Number(result._sum.amount || 0) - Number(result._sum.amountPaid || 0);
        return { totalOwed, pendingCount: result._count };
    }
}
