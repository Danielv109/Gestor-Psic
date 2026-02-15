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
var ExportPatientPolicy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPatientPolicy = void 0;
const common_1 = require("@nestjs/common");
const collaborations_repository_1 = require("../../collaborations/collaborations.repository");
const patients_repository_1 = require("../../patients/patients.repository");
const client_1 = require("@prisma/client");
let ExportPatientPolicy = ExportPatientPolicy_1 = class ExportPatientPolicy {
    constructor(collaborationsRepo, patientsRepo) {
        this.collaborationsRepo = collaborationsRepo;
        this.patientsRepo = patientsRepo;
        this.logger = new common_1.Logger(ExportPatientPolicy_1.name);
    }
    async handle(user, request, context) {
        const patientId = request.params?.id;
        if (!patientId) {
            return false;
        }
        const patient = await this.patientsRepo.findById(patientId);
        if (!patient) {
            this.logger.warn(`Patient ${patientId} not found for export`);
            return false;
        }
        if (user.globalRole === client_1.GlobalRole.AUDITOR) {
            return true;
        }
        if (user.globalRole !== client_1.GlobalRole.SUPERVISOR) {
            this.logger.warn(`User ${user.id} with role ${user.globalRole} cannot export patient history`);
            return false;
        }
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(user.id, patientId);
        if (!collaboration) {
            this.logger.warn(`Supervisor ${user.id} has no collaboration for patient ${patientId}`);
            return false;
        }
        const allowedRoles = [
            client_1.ContextualRole.SUPERVISOR_CASO,
            client_1.ContextualRole.TERAPEUTA_TITULAR,
        ];
        if (!allowedRoles.includes(collaboration.contextualRole)) {
            this.logger.warn(`User ${user.id} has insufficient contextual role: ${collaboration.contextualRole}`);
            return false;
        }
        return true;
    }
};
exports.ExportPatientPolicy = ExportPatientPolicy;
exports.ExportPatientPolicy = ExportPatientPolicy = ExportPatientPolicy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [collaborations_repository_1.CollaborationsRepository,
        patients_repository_1.PatientsRepository])
], ExportPatientPolicy);
//# sourceMappingURL=export-patient.policy.js.map