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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const create_payment_dto_1 = require("./dto/create-payment.dto");
const update_payment_dto_1 = require("./dto/update-payment.dto");
const prisma_service_1 = require("../../prisma/prisma.service");
let PaymentsController = class PaymentsController {
    constructor(payments, prisma) {
        this.payments = payments;
        this.prisma = prisma;
    }
    async createPayment(sessionId, dto, req) {
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
    async getPatientPayments(patientId) {
        const [payments, balance] = await Promise.all([
            this.payments.findByPatient(patientId),
            this.payments.getPatientBalance(patientId),
        ]);
        return { payments, balance };
    }
    async getPendingPayments(req) {
        return this.payments.findPending(req.user.sub);
    }
    async updatePayment(id, dto, req) {
        return this.payments.update(id, dto, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('sessions/:sessionId/payment'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_payment_dto_1.CreatePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPayment", null);
__decorate([
    (0, common_1.Get)('patients/:patientId/payments'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPatientPayments", null);
__decorate([
    (0, common_1.Get)('payments/pending'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPendingPayments", null);
__decorate([
    (0, common_1.Patch)('payments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_payment_dto_1.UpdatePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "updatePayment", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        prisma_service_1.PrismaService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map