import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus, AuditAction, AuditResource } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly repo: PaymentsRepository,
        private readonly audit: AuditService,
    ) { }

    async create(dto: CreatePaymentDto, user: { id: string; ip: string }) {
        const existing = await this.repo.findBySessionId(dto.sessionId);
        if (existing) throw new ConflictException('Ya existe un registro de pago para esta sesión');

        const payment = await this.repo.create({
            sessionId: dto.sessionId,
            patientId: '', // will be set below
            therapistId: user.id,
            amount: dto.amount,
            method: dto.method,
            notes: dto.notes,
        });

        // We need the session info to set patientId correctly
        // The controller should pass it, but here we just use it for audit
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.SESSION_PAYMENT,
            resourceId: payment.id,
        });

        return payment;
    }

    async createForSession(
        sessionId: string,
        patientId: string,
        dto: CreatePaymentDto,
        user: { id: string; ip: string },
    ) {
        const existing = await this.repo.findBySessionId(sessionId);
        if (existing) throw new ConflictException('Ya existe un registro de pago para esta sesión');

        const payment = await this.repo.create({
            sessionId,
            patientId,
            therapistId: user.id,
            amount: dto.amount,
            method: dto.method,
            notes: dto.notes,
        });

        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.SESSION_PAYMENT,
            resourceId: payment.id,
            patientId,
        });

        return payment;
    }

    async findByPatient(patientId: string) {
        return this.repo.findByPatientId(patientId);
    }

    async findPending(therapistId?: string) {
        return this.repo.findPending(therapistId);
    }

    async getPatientBalance(patientId: string) {
        return this.repo.getPatientBalance(patientId);
    }

    async update(id: string, dto: UpdatePaymentDto, user: { id: string; ip: string }) {
        const payment = await this.repo.findById(id);
        if (!payment) throw new NotFoundException('Pago no encontrado');

        const updateData: any = { ...dto };

        if (dto.status === PaymentStatus.PAID) {
            updateData.amountPaid = Number(payment.amount);
            updateData.paidAt = new Date();
        }

        const updated = await this.repo.update(id, updateData);

        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.SESSION_PAYMENT,
            resourceId: id,
            patientId: payment.patientId,
            details: { status: dto.status },
        });

        return updated;
    }
}
