"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportModule = void 0;
const common_1 = require("@nestjs/common");
const export_controller_1 = require("./export.controller");
const export_service_1 = require("./export.service");
const crypto_module_1 = require("../../crypto/crypto.module");
const audit_module_1 = require("../audit/audit.module");
const collaborations_module_1 = require("../collaborations/collaborations.module");
const sessions_module_1 = require("../sessions/sessions.module");
const patients_module_1 = require("../patients/patients.module");
const export_session_policy_1 = require("./policies/export-session.policy");
const export_patient_policy_1 = require("./policies/export-patient.policy");
const policies_guard_1 = require("../../common/guards/policies.guard");
let ExportModule = class ExportModule {
};
exports.ExportModule = ExportModule;
exports.ExportModule = ExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            crypto_module_1.CryptoModule,
            audit_module_1.AuditModule,
            collaborations_module_1.CollaborationsModule,
            sessions_module_1.SessionsModule,
            patients_module_1.PatientsModule,
        ],
        controllers: [export_controller_1.ExportController],
        providers: [
            export_service_1.ExportService,
            export_session_policy_1.ExportSessionPolicy,
            export_patient_policy_1.ExportPatientPolicy,
            policies_guard_1.PoliciesGuard,
        ],
        exports: [export_service_1.ExportService],
    })
], ExportModule);
//# sourceMappingURL=export.module.js.map