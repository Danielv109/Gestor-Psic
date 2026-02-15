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
exports.ExportController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const export_service_1 = require("./export.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const policies_decorator_1 = require("../../common/decorators/policies.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const export_interfaces_1 = require("./interfaces/export.interfaces");
const export_session_policy_1 = require("./policies/export-session.policy");
const export_patient_policy_1 = require("./policies/export-patient.policy");
const policies_guard_1 = require("../../common/guards/policies.guard");
class ExportOptionsDto {
}
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async exportSession(sessionId, options, user) {
        const exportDoc = await this.exportService.exportSession(sessionId, user, {
            format: options.format || export_interfaces_1.ExportFormat.JSON,
            includeNarrative: options.includeNarrative ?? true,
            includePatientDetails: options.includePatientDetails ?? true,
            maskPII: options.maskPII ?? false,
            timezone: options.timezone,
        });
        return exportDoc;
    }
    async getSessionPdfStructure(sessionId, options, user) {
        const exportDoc = await this.exportService.exportSession(sessionId, user, {
            format: export_interfaces_1.ExportFormat.PDF,
            includeNarrative: options.includeNarrative ?? true,
            includePatientDetails: options.includePatientDetails ?? true,
            maskPII: options.maskPII ?? false,
            timezone: options.timezone,
        });
        const pdfStructure = this.exportService.generatePdfStructure(exportDoc);
        return {
            document: exportDoc,
            pdfStructure,
        };
    }
    async exportPatientHistory(patientId, options, user) {
        const exportDoc = await this.exportService.exportPatientHistory(patientId, user, {
            format: options.format || export_interfaces_1.ExportFormat.JSON,
            includeNarrative: options.includeNarrative ?? true,
            includePatientDetails: options.includePatientDetails ?? true,
            maskPII: options.maskPII ?? false,
            timezone: options.timezone,
        });
        return exportDoc;
    }
    async getMyExportPermissions(user) {
        const { EXPORT_PERMISSIONS } = await Promise.resolve().then(() => require('./interfaces/export.interfaces'));
        const permissions = EXPORT_PERMISSIONS[user.globalRole];
        return {
            role: user.globalRole,
            permissions,
            notes: this.getPermissionNotes(user.globalRole),
        };
    }
    getPermissionNotes(role) {
        const notes = [];
        switch (role) {
            case client_1.GlobalRole.TERAPEUTA:
                notes.push('Puede exportar sesiones de sus pacientes');
                notes.push('Puede ver y exportar su nota sombra propia');
                notes.push('No puede hacer exportación masiva');
                break;
            case client_1.GlobalRole.SUPERVISOR:
                notes.push('Puede exportar sesiones de todos los pacientes supervisados');
                notes.push('No puede ver notas sombra de otros terapeutas');
                notes.push('Puede hacer exportación masiva');
                break;
            case client_1.GlobalRole.AUDITOR:
                notes.push('Puede exportar para auditoría');
                notes.push('PII de pacientes está enmascarado');
                notes.push('NUNCA puede ver notas sombra');
                notes.push('Solo puede ver narrativa clínica para auditoría');
                break;
            case client_1.GlobalRole.ASISTENTE:
                notes.push('No tiene permisos de exportación');
                break;
        }
        return notes;
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Post)('session/:id'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.AUDITOR),
    (0, common_1.UseGuards)(policies_guard_1.PoliciesGuard),
    (0, policies_decorator_1.CheckPolicies)(export_session_policy_1.ExportSessionPolicy),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ExportOptionsDto, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportSession", null);
__decorate([
    (0, common_1.Post)('session/:id/pdf-structure'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.AUDITOR),
    (0, common_1.UseGuards)(policies_guard_1.PoliciesGuard),
    (0, policies_decorator_1.CheckPolicies)(export_session_policy_1.ExportSessionPolicy),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ExportOptionsDto, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "getSessionPdfStructure", null);
__decorate([
    (0, common_1.Post)('patient/:id/history'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.AUDITOR),
    (0, common_1.UseGuards)(policies_guard_1.PoliciesGuard),
    (0, policies_decorator_1.CheckPolicies)(export_patient_policy_1.ExportPatientPolicy),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ExportOptionsDto, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "exportPatientHistory", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, roles_decorator_1.Roles)(client_1.GlobalRole.TERAPEUTA, client_1.GlobalRole.SUPERVISOR, client_1.GlobalRole.AUDITOR, client_1.GlobalRole.ASISTENTE),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "getMyExportPermissions", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)('export'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 300000 } }),
    __metadata("design:paramtypes", [export_service_1.ExportService])
], ExportController);
//# sourceMappingURL=export.controller.js.map