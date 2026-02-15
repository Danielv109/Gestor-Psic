import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from '../../prisma/prisma.service';
export declare class PaymentsController {
    private readonly payments;
    private readonly prisma;
    constructor(payments: PaymentsService, prisma: PrismaService);
    createPayment(sessionId: string, dto: CreatePaymentDto, req: any): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
        notes: string | null;
    }>;
    getPatientPayments(patientId: string): Promise<{
        payments: ({
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
            amount: import("@prisma/client/runtime/library").Decimal;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date | null;
            notes: string | null;
        })[];
        balance: {
            totalOwed: number;
            pendingCount: number;
        };
    }>;
    getPendingPayments(req: any): Promise<({
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
        amount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
        notes: string | null;
    })[]>;
    updatePayment(id: string, dto: UpdatePaymentDto, req: any): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        method: import(".prisma/client").$Enums.PaymentMethod | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
        notes: string | null;
    }>;
}
