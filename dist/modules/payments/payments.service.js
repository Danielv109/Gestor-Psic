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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const payments_repository_1 = require("./payments.repository");
const client_1 = require("@prisma/client");
const audit_service_1 = require("../audit/audit.service");
let PaymentsService = class PaymentsService {
    constructor(repo, audit) {
        this.repo = repo;
        this.audit = audit;
    }
    async create(dto, user) {
        const existing = await this.repo.findBySessionId(dto.sessionId);
        if (existing)
            throw new common_1.ConflictException('Ya existe un registro de pago para esta sesión');
        const payment = await this.repo.create({
            sessionId: dto.sessionId,
            patientId: '',
            therapistId: user.id,
            amount: dto.amount,
            method: dto.method,
            notes: dto.notes,
        });
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.SESSION_PAYMENT,
            resourceId: payment.id,
        });
        return payment;
    }
    async createForSession(sessionId, patientId, dto, user) {
        const existing = await this.repo.findBySessionId(sessionId);
        if (existing)
            throw new common_1.ConflictException('Ya existe un registro de pago para esta sesión');
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
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.SESSION_PAYMENT,
            resourceId: payment.id,
            patientId,
        });
        return payment;
    }
    async findByPatient(patientId) {
        return this.repo.findByPatientId(patientId);
    }
    async findPending(therapistId) {
        return this.repo.findPending(therapistId);
    }
    async getPatientBalance(patientId) {
        return this.repo.getPatientBalance(patientId);
    }
    async update(id, dto, user) {
        const payment = await this.repo.findById(id);
        if (!payment)
            throw new common_1.NotFoundException('Pago no encontrado');
        const updateData = { ...dto };
        if (dto.status === client_1.PaymentStatus.PAID) {
            updateData.amountPaid = Number(payment.amount);
            updateData.paidAt = new Date();
        }
        const updated = await this.repo.update(id, updateData);
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.SESSION_PAYMENT,
            resourceId: id,
            patientId: payment.patientId,
            details: { status: dto.status },
        });
        return updated;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payments_repository_1.PaymentsRepository,
        audit_service_1.AuditService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map