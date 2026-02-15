// src/modules/patients/patients.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditAction, AuditResource } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientsService {
    constructor(
        private readonly patientsRepo: PatientsRepository,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreatePatientDto, actor: AuthenticatedUser) {
        // Generar ID externo visible (no UUID)
        const externalId = this.generateExternalId();

        // Map DTO fields to Prisma model fields
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

        // Crear ClinicalCollaboration - vincular paciente al terapeuta que lo creó
        // Sin esta relación, el paciente no aparece en findByTherapist
        await this.patientsRepo.createCollaboration({
            patientId: patient.id,
            userId: actor.id,
            contextualRole: 'TERAPEUTA_TITULAR',
        });

        // Auditoría: CREATE
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.PATIENT,
            resourceId: patient.id,
            patientId: patient.id,
            success: true,
            details: { externalId: patient.externalId },
        });

        return patient;
    }

    async findById(id: string, actor: AuthenticatedUser) {
        const patient = await this.patientsRepo.findById(id);

        if (!patient) {
            throw new NotFoundException(`Paciente ${id} no encontrado`);
        }

        // Auditoría: READ
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.PATIENT,
            resourceId: patient.id,
            patientId: patient.id,
            success: true,
        });

        return patient;
    }

    async findByTherapist(therapistId: string, actor: AuthenticatedUser) {
        const patients = await this.patientsRepo.findByTherapist(therapistId);

        // Auditoría: READ (lista)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.PATIENT,
            resourceId: therapistId, // El recurso es la lista del terapeuta
            success: true,
            details: { count: patients.length, type: 'list' },
        });

        return patients;
    }

    async update(id: string, dto: UpdatePatientDto, actor: AuthenticatedUser) {
        const existing = await this.patientsRepo.findById(id);

        if (!existing) {
            throw new NotFoundException(`Paciente ${id} no encontrado`);
        }

        // Map DTO fields to Prisma model fields
        const { email, phone, emergencyName, isMinor, isActive, ...rest } = dto;
        const prismaData: any = { ...rest };

        if (email !== undefined) prismaData.contactEmail = email;
        if (phone !== undefined) prismaData.contactPhone = phone;
        if (emergencyName !== undefined) prismaData.emergencyContactName = emergencyName;
        if (isActive !== undefined) prismaData.isActive = isActive;
        if (dto.dateOfBirth) prismaData.dateOfBirth = new Date(dto.dateOfBirth);

        // Remove DTO-only fields that don't exist in Prisma
        delete prismaData.email;
        delete prismaData.phone;

        const updated = await this.patientsRepo.update(id, prismaData);

        // Auditoría: UPDATE
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { updatedFields: Object.keys(dto) },
        });

        return updated;
    }

    async softDelete(id: string, actor: AuthenticatedUser) {
        const existing = await this.patientsRepo.findById(id);

        if (!existing) {
            throw new NotFoundException(`Paciente ${id} no encontrado`);
        }

        const deleted = await this.patientsRepo.softDelete(id);

        // Auditoría: DELETE (soft)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.DELETE,
            resource: AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { softDelete: true },
        });

        return deleted;
    }

    async findWithTeam(id: string, actor: AuthenticatedUser) {
        const patient = await this.patientsRepo.findWithCollaborations(id);

        if (!patient) {
            throw new NotFoundException(`Paciente ${id} no encontrado`);
        }

        // Auditoría: READ con equipo
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { includeTeam: true },
        });

        return patient;
    }

    async updateRisk(
        id: string,
        dto: { isHighRisk: boolean; riskLevel?: string; riskNotes?: string },
        actor: AuthenticatedUser,
    ) {
        const existing = await this.patientsRepo.findById(id);
        if (!existing) throw new NotFoundException(`Paciente ${id} no encontrado`);

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
            action: AuditAction.UPDATE,
            resource: AuditResource.PATIENT,
            resourceId: id,
            patientId: id,
            success: true,
            details: { riskUpdate: true, isHighRisk: dto.isHighRisk, riskLevel: dto.riskLevel },
        });

        return updated;
    }

    private generateExternalId(): string {
        // Formato: PAT-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PAT-${dateStr}-${random}`;
    }
}
