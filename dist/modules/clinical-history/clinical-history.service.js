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
exports.ClinicalHistoryService = void 0;
const common_1 = require("@nestjs/common");
const clinical_history_repository_1 = require("./clinical-history.repository");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let ClinicalHistoryService = class ClinicalHistoryService {
    constructor(repo, auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }
    async create(dto, actor) {
        const exists = await this.repo.existsForPatient(dto.patientId);
        if (exists) {
            throw new common_1.ConflictException(`Ya existe una Historia Clínica para el paciente ${dto.patientId}`);
        }
        const history = await this.repo.create({
            patient: { connect: { id: dto.patientId } },
            therapist: { connect: { id: actor.id } },
            openedAt: dto.openedAt ? new Date(dto.openedAt) : new Date(),
            identification: dto.identification ? dto.identification : undefined,
            consultation: dto.consultation ? dto.consultation : undefined,
            antecedents: dto.antecedents ? dto.antecedents : undefined,
            mentalExam: dto.mentalExam ? dto.mentalExam : undefined,
            diagnosticImpression: dto.diagnosticImpression ? dto.diagnosticImpression : undefined,
            treatmentPlan: dto.treatmentPlan ? dto.treatmentPlan : undefined,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.PATIENT,
            resourceId: history.id,
            patientId: dto.patientId,
            success: true,
            details: { type: 'CLINICAL_HISTORY' },
        });
        return history;
    }
    async findByPatientId(patientId, actor) {
        const history = await this.repo.findByPatientId(patientId);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.PATIENT,
            resourceId: patientId,
            patientId,
            success: true,
            details: { type: 'CLINICAL_HISTORY', found: !!history },
        });
        return history;
    }
    async update(id, dto, actor) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Historia Clínica ${id} no encontrada`);
        }
        const updated = await this.repo.update(id, {
            identification: dto.identification ? dto.identification : undefined,
            consultation: dto.consultation ? dto.consultation : undefined,
            antecedents: dto.antecedents ? dto.antecedents : undefined,
            mentalExam: dto.mentalExam ? dto.mentalExam : undefined,
            diagnosticImpression: dto.diagnosticImpression ? dto.diagnosticImpression : undefined,
            treatmentPlan: dto.treatmentPlan ? dto.treatmentPlan : undefined,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.PATIENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { type: 'CLINICAL_HISTORY' },
        });
        return updated;
    }
};
exports.ClinicalHistoryService = ClinicalHistoryService;
exports.ClinicalHistoryService = ClinicalHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clinical_history_repository_1.ClinicalHistoryRepository,
        audit_service_1.AuditService])
], ClinicalHistoryService);
//# sourceMappingURL=clinical-history.service.js.map