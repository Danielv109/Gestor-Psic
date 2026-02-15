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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const patients_repository_1 = require("./patients.repository");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let PatientsService = class PatientsService {
    constructor(patientsRepo, auditService) {
        this.patientsRepo = patientsRepo;
        this.auditService = auditService;
    }
    async create(dto, actor) {
        const externalId = this.generateExternalId();
        const { email, phone, emergencyName, isMinor, ...rest } = dto;
        const patient = await this.patientsRepo.create({
            ...rest,
            contactEmail: email,
            contactPhone: phone,
            emergencyContactName: emergencyName,
            dateOfBirth: new Date(dto.dateOfBirth),
            externalId,
            creator: { connect: { id: actor.id } },
        });
        await this.patientsRepo.createCollaboration({
            patientId: patient.id,
            userId: actor.id,
            contextualRole: 'TERAPEUTA_TITULAR',
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.PATIENT,
            resourceId: patient.id,
            patientId: patient.id,
            success: true,
            details: { externalId: patient.externalId },
        });
        return patient;
    }
    async findById(id, actor) {
        const patient = await this.patientsRepo.findById(id);
        if (!patient) {
            throw new common_1.NotFoundException(`Paciente ${id} no encontrado`);
        }
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.PATIENT,
            resourceId: patient.id,
            patientId: patient.id,
            success: true,
        });
        return patient;
    }
    async findByTherapist(therapistId, actor) {
        const patients = await this.patientsRepo.findByTherapist(therapistId);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.PATIENT,
            resourceId: therapistId,
            success: true,
            details: { count: patients.length, type: 'list' },
        });
        return patients;
    }
    async update(id, dto, actor) {
        const existing = await this.patientsRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Paciente ${id} no encontrado`);
        }
        const { email, phone, emergencyName, isMinor, isActive, ...rest } = dto;
        const prismaData = { ...rest };
        if (email !== undefined)
            prismaData.contactEmail = email;
        if (phone !== undefined)
            prismaData.contactPhone = phone;
        if (emergencyName !== undefined)
            prismaData.emergencyContactName = emergencyName;
        if (isActive !== undefined)
            prismaData.isActive = isActive;
        if (dto.dateOfBirth)
            prismaData.dateOfBirth = new Date(dto.dateOfBirth);
        delete prismaData.email;
        delete prismaData.phone;
        const updated = await this.patientsRepo.update(id, prismaData);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { updatedFields: Object.keys(dto) },
        });
        return updated;
    }
    async softDelete(id, actor) {
        const existing = await this.patientsRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Paciente ${id} no encontrado`);
        }
        const deleted = await this.patientsRepo.softDelete(id);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.DELETE,
            resource: client_1.AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { softDelete: true },
        });
        return deleted;
    }
    async findWithTeam(id, actor) {
        const patient = await this.patientsRepo.findWithCollaborations(id);
        if (!patient) {
            throw new common_1.NotFoundException(`Paciente ${id} no encontrado`);
        }
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { includeTeam: true },
        });
        return patient;
    }
    async updateRisk(id, dto, actor) {
        const existing = await this.patientsRepo.findById(id);
        if (!existing)
            throw new common_1.NotFoundException(`Paciente ${id} no encontrado`);
        const updated = await this.patientsRepo.update(id, {
            isHighRisk: dto.isHighRisk,
            riskLevel: dto.riskLevel || (dto.isHighRisk ? 'HIGH' : null),
            riskNotes: dto.riskNotes || null,
            riskAssessedAt: new Date(),
            riskAssessedBy: actor.id,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { riskUpdate: true, isHighRisk: dto.isHighRisk, riskLevel: dto.riskLevel },
        });
        return updated;
    }
    generateExternalId() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PAT-${dateStr}-${random}`;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [patients_repository_1.PatientsRepository,
        audit_service_1.AuditService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map