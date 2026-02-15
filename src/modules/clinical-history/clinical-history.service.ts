// src/modules/clinical-history/clinical-history.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ClinicalHistoryRepository } from './clinical-history.repository';
import { CreateClinicalHistoryDto, UpdateClinicalHistoryDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClinicalHistoryService {
    constructor(
        private readonly repo: ClinicalHistoryRepository,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateClinicalHistoryDto, actor: AuthenticatedUser) {
        // Verificar que no exista ya una historia para este paciente
        const exists = await this.repo.existsForPatient(dto.patientId);
        if (exists) {
            throw new ConflictException(
                `Ya existe una Historia Clínica para el paciente ${dto.patientId}`,
            );
        }

        const history = await this.repo.create({
            patient: { connect: { id: dto.patientId } },
            therapist: { connect: { id: actor.id } },
            openedAt: dto.openedAt ? new Date(dto.openedAt) : new Date(),
            identification: dto.identification ? (dto.identification as unknown as Prisma.InputJsonValue) : undefined,
            consultation: dto.consultation ? (dto.consultation as unknown as Prisma.InputJsonValue) : undefined,
            antecedents: dto.antecedents ? (dto.antecedents as unknown as Prisma.InputJsonValue) : undefined,
            mentalExam: dto.mentalExam ? (dto.mentalExam as unknown as Prisma.InputJsonValue) : undefined,
            diagnosticImpression: dto.diagnosticImpression ? (dto.diagnosticImpression as unknown as Prisma.InputJsonValue) : undefined,
            treatmentPlan: dto.treatmentPlan ? (dto.treatmentPlan as unknown as Prisma.InputJsonValue) : undefined,
        });

        // Auditoría
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.PATIENT,
            resourceId: history.id,
            patientId: dto.patientId,
            success: true,
            details: { type: 'CLINICAL_HISTORY' },
        });

        return history;
    }

    async findByPatientId(patientId: string, actor: AuthenticatedUser) {
        const history = await this.repo.findByPatientId(patientId);

        // Auditoría
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.PATIENT,
            resourceId: patientId,
            patientId,
            success: true,
            details: { type: 'CLINICAL_HISTORY', found: !!history },
        });

        return history;
    }

    async update(id: string, dto: UpdateClinicalHistoryDto, actor: AuthenticatedUser) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new NotFoundException(`Historia Clínica ${id} no encontrada`);
        }

        const updated = await this.repo.update(id, {
            identification: dto.identification ? (dto.identification as unknown as Prisma.InputJsonValue) : undefined,
            consultation: dto.consultation ? (dto.consultation as unknown as Prisma.InputJsonValue) : undefined,
            antecedents: dto.antecedents ? (dto.antecedents as unknown as Prisma.InputJsonValue) : undefined,
            mentalExam: dto.mentalExam ? (dto.mentalExam as unknown as Prisma.InputJsonValue) : undefined,
            diagnosticImpression: dto.diagnosticImpression ? (dto.diagnosticImpression as unknown as Prisma.InputJsonValue) : undefined,
            treatmentPlan: dto.treatmentPlan ? (dto.treatmentPlan as unknown as Prisma.InputJsonValue) : undefined,
        });

        // Auditoría
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.PATIENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { type: 'CLINICAL_HISTORY' },
        });

        return updated;
    }
}
