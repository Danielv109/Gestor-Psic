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
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("./appointments.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const policies_decorator_1 = require("../../common/decorators/policies.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const appointment_access_policy_1 = require("./policies/appointment-access.policy");
const client_1 = require("@prisma/client");
let AppointmentsController = class AppointmentsController {
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    async create(dto, user) {
        return this.appointmentsService.create(dto, user);
    }
    async findUpcoming(user) {
        return this.appointmentsService.findMyUpcoming(user);
    }
    async findByRange(start, end, user) {
        return this.appointmentsService.findByDateRange(start, end, user);
    }
    async findById(id, user) {
        return this.appointmentsService.findById(id, user);
    }
    async update(id, dto, user) {
        return this.appointmentsService.update(id, dto, user);
    }
    async confirm(id, user) {
        return this.appointmentsService.confirm(id, user);
    }
    async cancel(id, dto, user) {
        return this.appointmentsService.cancel(id, dto, user);
    }
    async remove(id, user) {
        await this.appointmentsService.softDelete(id, user);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findUpcoming", null);
__decorate([
    (0, common_1.Get)('range'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, common_1.Query)('start')),
    __param(1, (0, common_1.Query)('end')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findByRange", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, policies_decorator_1.CheckPolicies)(appointment_access_policy_1.AppointmentAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, policies_decorator_1.CheckPolicies)(appointment_access_policy_1.AppointmentAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, policies_decorator_1.CheckPolicies)(appointment_access_policy_1.AppointmentAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.ASISTENTE),
    (0, policies_decorator_1.CheckPolicies)(appointment_access_policy_1.AppointmentAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CancelAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.SUPERVISOR),
    (0, policies_decorator_1.CheckPolicies)(appointment_access_policy_1.AppointmentAccessPolicy),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "remove", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.Controller)('appointments'),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map