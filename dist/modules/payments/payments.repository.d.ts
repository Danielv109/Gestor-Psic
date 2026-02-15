import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class PaymentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.SessionPaymentUncheckedCreateInput): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        paidAt: Date | null;
        notes: string | null;
    }>;
    findById(id: string): Promise<({
        patient: {
            id: string;
            firstName: string;
            lastName: string;
            externalId: string;
        };
        session: {
            id: string;
            appointmentId: string;
            startedAt: Date;
        };
    } & {
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        paidAt: Date | null;
        notes: string | null;
    }) | null>;
    findBySessionId(sessionId: string): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        paidAt: Date | null;
        notes: string | null;
    } | null>;
    findByPatientId(patientId: string): Promise<({
        session: {
            id: string;
            startedAt: Date;
        };
    } & {
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        paidAt: Date | null;
        notes: string | null;
    })[]>;
    findPending(therapistId?: string): Promise<({
        patient: {
            id: string;
            firstName: string;
            lastName: string;
            externalId: string;
        };
        session: {
            id: string;
            startedAt: Date;
        };
    } & {
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        paidAt: Date | null;
        notes: string | null;
    })[]>;
    update(id: string, data: Prisma.SessionPaymentUncheckedUpdateInput): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: Prisma.Decimal;
        amountPaid: Prisma.Decimal;
        paidAt: Date | null;
        notes: string | null;
    }>;
    getPatientBalance(patientId: string): Promise<{
        totalOwed: number;
        pendingCount: number;
    }>;
}
