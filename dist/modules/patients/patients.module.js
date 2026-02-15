"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const patients_controller_1 = require("./patients.controller");
const patients_service_1 = require("./patients.service");
const patients_repository_1 = require("./patients.repository");
const patient_access_policy_1 = require("./policies/patient-access.policy");
const collaborations_module_1 = require("../collaborations/collaborations.module");
const audit_module_1 = require("../audit/audit.module");
const crypto_module_1 = require("../../crypto/crypto.module");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [collaborations_module_1.CollaborationsModule, audit_module_1.AuditModule, crypto_module_1.CryptoModule],
        controllers: [patients_controller_1.PatientsController],
        providers: [patients_service_1.PatientsService, patients_repository_1.PatientsRepository, patient_access_policy_1.PatientAccessPolicy],
        exports: [patients_service_1.PatientsService, patients_repository_1.PatientsRepository],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map