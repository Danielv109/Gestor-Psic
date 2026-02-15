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
exports.PaymentsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentsRepository = class PaymentsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.sessionPayment.create({ data });
    }
    async findById(id) {
        return this.prisma.sessionPayment.findUnique({
            where: { id },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, externalId: true } },
                session: { select: { id: true, startedAt: true, appointmentId: true } },
            },
        });
    }
    async findBySessionId(sessionId) {
        return this.prisma.sessionPayment.findUnique({
            where: { sessionId },
        });
    }
    async findByPatientId(patientId) {
        return this.prisma.sessionPayment.findMany({
            where: { patientId },
            include: {
                session: { select: { id: true, startedAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findPending(therapistId) {
        const where = {
            status: { in: [client_1.PaymentStatus.PENDING, client_1.PaymentStatus.PARTIAL] },
        };
        if (therapistId)
            where.therapistId = therapistId;
        return this.prisma.sessionPayment.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, externalId: true } },
                session: { select: { id: true, startedAt: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(id, data) {
        return this.prisma.sessionPayment.update({ where: { id }, data });
    }
    async getPatientBalance(patientId) {
        const result = await this.prisma.sessionPayment.aggregate({
            where: { patientId, status: { in: [client_1.PaymentStatus.PENDING, client_1.PaymentStatus.PARTIAL] } },
            _sum: { amount: true, amountPaid: true },
            _count: true,
        });
        const totalOwed = Number(result._sum.amount || 0) - Number(result._sum.amountPaid || 0);
        return { totalOwed, pendingCount: result._count };
    }
};
exports.PaymentsRepository = PaymentsRepository;
exports.PaymentsRepository = PaymentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsRepository);
//# sourceMappingURL=payments.repository.js.map