import { PaymentsRepository } from './payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { AuditService } from '../audit/audit.service';
export declare class PaymentsService {
    private readonly repo;
    private readonly audit;
    constructor(repo: PaymentsRepository, audit: AuditService);
    create(dto: CreatePaymentDto, user: {
        id: string;
        ip: string;
    }): Promise<{
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
    createForSession(sessionId: string, patientId: string, dto: CreatePaymentDto, user: {
        id: string;
        ip: string;
    }): Promise<{
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
    findByPatient(patientId: string): Promise<({
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
        amount: import("@prisma/client/runtime/library").Decimal;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
        notes: string | null;
    })[]>;
    getPatientBalance(patientId: string): Promise<{
        totalOwed: number;
        pendingCount: number;
    }>;
    update(id: string, dto: UpdatePaymentDto, user: {
        id: string;
        ip: string;
    }): Promise<{
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
