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
exports.WorkflowController = void 0;
const common_1 = require("@nestjs/common");
const clinical_workflow_service_1 = require("./clinical-workflow.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
class StartSessionDto {
}
class EndSessionDto {
}
class SignSessionDto {
}
class CancelAppointmentDto {
}
let WorkflowController = class WorkflowController {
    constructor(workflowService) {
        this.workflowService = workflowService;
    }
    async getWorkflowStatus(id) {
        return this.workflowService.getWorkflowStatus(id);
    }
    async confirmAppointment(id, user) {
        const appointment = await this.workflowService.confirmAppointment(id, user);
        return {
            message: 'Cita confirmada',
            appointment,
        };
    }
    async markNoShow(id, user) {
        const appointment = await this.workflowService.markNoShow(id, user);
        return {
            message: 'Cita marcada como no-show',
            appointment,
        };
    }
    async cancelAppointment(id, dto, user) {
        const appointment = await this.workflowService.cancelAppointment(id, dto.reason, user);
        return {
            message: 'Cita cancelada',
            appointment,
        };
    }
    async startSession(appointmentId, dto, user) {
        const result = await this.workflowService.startSession(appointmentId, user, dto.initialNarrative);
        return {
            message: 'Sesión iniciada',
            session: {
                id: result.session.id,
                startedAt: result.session.startedAt,
            },
            appointmentStatus: result.appointmentStatus,
        };
    }
    async endSession(sessionId, dto, user) {
        const result = await this.workflowService.endSession(sessionId, dto.narrative, user);
        return {
            message: 'Sesión cerrada',
            session: {
                id: result.session.id,
                endedAt: result.session.endedAt,
                durationMinutes: result.durationMinutes,
            },
            appointmentStatus: result.appointmentStatus,
            nextAction: 'Firmar sesión para completar',
        };
    }
    async signSession(sessionId, dto, user) {
        const result = await this.workflowService.signSession(sessionId, dto.signatureConfirmation, user);
        return {
            message: 'Sesión firmada y bloqueada',
            session: {
                id: result.session.id,
                signedAt: result.session.signedAt,
                isLocked: result.isLocked,
            },
            signatureHash: result.signatureHash.substring(0, 16) + '...',
            warning: 'Esta sesión ya no puede modificarse',
        };
    }
};
exports.WorkflowController = WorkflowController;
__decorate([
    (0, common_1.Get)('appointment/:id/status'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "getWorkflowStatus", null);
__decorate([
    (0, common_1.Post)('appointment/:id/confirm'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "confirmAppointment", null);
__decorate([
    (0, common_1.Post)('appointment/:id/no-show'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "markNoShow", null);
__decorate([
    (0, common_1.Post)('appointment/:id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CancelAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "cancelAppointment", null);
__decorate([
    (0, common_1.Post)('appointment/:id/start-session'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, StartSessionDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('session/:id/end'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, EndSessionDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "endSession", null);
__decorate([
    (0, common_1.Post)('session/:id/sign'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SignSessionDto, Object]),
    __metadata("design:returntype", Promise)
], WorkflowController.prototype, "signSession", null);
exports.WorkflowController = WorkflowController = __decorate([
    (0, common_1.Controller)('workflow'),
    __metadata("design:paramtypes", [clinical_workflow_service_1.ClinicalWorkflowService])
], WorkflowController);
//# sourceMappingURL=workflow.controller.js.map