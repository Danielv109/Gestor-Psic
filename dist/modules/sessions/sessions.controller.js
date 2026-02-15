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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const sessions_service_1 = require("./sessions.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const policies_decorator_1 = require("../../common/decorators/policies.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const session_access_policy_1 = require("./policies/session-access.policy");
const client_1 = require("@prisma/client");
let SessionsController = class SessionsController {
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    async create(dto, user) {
        return this.sessionsService.create(dto, user);
    }
    async findMySessions(isDraft, user) {
        return this.sessionsService.findByTherapist(user, isDraft);
    }
    async findByPatient(patientId, user) {
        return this.sessionsService.findByPatient(patientId, user);
    }
    async findById(id, user) {
        return this.sessionsService.findById(id, user);
    }
    async getVersions(id, user) {
        return this.sessionsService.getVersions(id, user);
    }
    async update(id, dto, user) {
        return this.sessionsService.update(id, dto, user);
    }
    async sign(id, dto, user) {
        return this.sessionsService.sign(id, dto, user);
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR),
    __param(0, (0, common_1.Query)('isDraft', new common_1.ParseBoolPipe({ optional: true }))),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "findMySessions", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR),
    (0, policies_decorator_1.CheckPolicies)(session_access_policy_1.SessionAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/versions'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR),
    (0, policies_decorator_1.CheckPolicies)(session_access_policy_1.SessionAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getVersions", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, policies_decorator_1.CheckPolicies)(session_access_policy_1.SessionAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, policies_decorator_1.CheckPolicies)(session_access_policy_1.SessionAccessPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SignSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "sign", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map