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
exports.ShadowNotesController = void 0;
const common_1 = require("@nestjs/common");
const shadow_notes_service_1 = require("./shadow-notes.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const policies_decorator_1 = require("../../common/decorators/policies.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const shadow_note_owner_policy_1 = require("./policies/shadow-note-owner.policy");
const client_1 = require("@prisma/client");
let ShadowNotesController = class ShadowNotesController {
    constructor(shadowNotesService) {
        this.shadowNotesService = shadowNotesService;
    }
    async create(dto, user) {
        return this.shadowNotesService.create(dto, user);
    }
    async findMyNotes(user) {
        return this.shadowNotesService.findMyNotes(user);
    }
    async findBySession(sessionId, user) {
        return this.shadowNotesService.findBySession(sessionId, user);
    }
    async findById(id, user) {
        return this.shadowNotesService.findById(id, user);
    }
    async update(id, dto, user) {
        return this.shadowNotesService.update(id, dto, user);
    }
    async remove(id, user) {
        await this.shadowNotesService.softDelete(id, user);
    }
};
exports.ShadowNotesController = ShadowNotesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateShadowNoteDto, Object]),
    __metadata("design:returntype", Promise)
], ShadowNotesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShadowNotesController.prototype, "findMyNotes", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    __param(0, (0, common_1.Param)('sessionId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShadowNotesController.prototype, "findBySession", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, policies_decorator_1.CheckPolicies)(shadow_note_owner_policy_1.ShadowNoteOwnerPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShadowNotesController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, policies_decorator_1.CheckPolicies)(shadow_note_owner_policy_1.ShadowNoteOwnerPolicy),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateShadowNoteDto, Object]),
    __metadata("design:returntype", Promise)
], ShadowNotesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA),
    (0, policies_decorator_1.CheckPolicies)(shadow_note_owner_policy_1.ShadowNoteOwnerPolicy),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShadowNotesController.prototype, "remove", null);
exports.ShadowNotesController = ShadowNotesController = __decorate([
    (0, common_1.Controller)('shadow-notes'),
    __metadata("design:paramtypes", [shadow_notes_service_1.ShadowNotesService])
], ShadowNotesController);
//# sourceMappingURL=shadow-notes.controller.js.map