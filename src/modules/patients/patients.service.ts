// src/modules/patients/patients.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditAction, AuditResource } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PatientsService {
    constructor(
        private readonly patientsRepo: PatientsRepository,
        private readonly prisma: PrismaService,
        private readonly cryptoService: CryptoService,
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

    /**
     * Quick search patients by name or externalId (max 5 results)
     */
    async quickSearch(query: string) {
        if (!query || query.trim().length < 2) return [];
        return this.patientsRepo.quickSearch(query.trim(), 5);
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

    /**
     * 5-minute briefing: last session plan + last shadow note + pending topics
     */
    async getBriefing(patientId: string, actor: AuthenticatedUser) {
        // Verify patient exists
        const patient = await this.patientsRepo.findById(patientId);
        if (!patient) {
            throw new NotFoundException(`Paciente ${patientId} no encontrado`);
        }

        // 1) Last completed session for this patient
        const lastSession = await this.prisma.clinicalSession.findFirst({
            where: {
                patientId,
                deletedAt: null,
            },
            orderBy: { startedAt: 'desc' },
        });

        let lastSessionPlan: string | null = null;
        let lastSessionDate: string | null = null;

        if (lastSession) {
            lastSessionDate = lastSession.startedAt.toISOString();
            // Decrypt narrative to get the plan
            try {
                if (lastSession.clinicalNarrativeEncrypted && lastSession.narrativeIV && lastSession.narrativeKeyId) {
                    const payload = {
                        encrypted: Buffer.from(lastSession.clinicalNarrativeEncrypted),
                        iv: Buffer.from(lastSession.narrativeIV),
                        keyId: lastSession.narrativeKeyId,
                    };
                    const narrative = await this.cryptoService.decryptClinicalNarrative(
                        payload,
                        lastSession.id,
                        actor.id,
                    );
                    lastSessionPlan = narrative.plan || null;
                }
            } catch {
                lastSessionPlan = '[No se pudo descifrar la narrativa]';
            }
        }

        // 2) Last shadow note for any session of this patient, by this therapist
        let lastShadowNote: string | null = null;
        let lastShadowNoteDate: string | null = null;

        const shadowNote = await this.prisma.shadowNote.findFirst({
            where: {
                therapistId: actor.id,
                deletedAt: null,
                session: {
                    patientId,
                    deletedAt: null,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (shadowNote) {
            lastShadowNoteDate = shadowNote.createdAt.toISOString();
            try {
                lastShadowNote = await this.cryptoService.decryptShadowNote(
                    shadowNote.contentEncrypted,
                    shadowNote.contentIV,
                    actor.id,
                    shadowNote.id,
                );
            } catch {
                lastShadowNote = '[No se pudo descifrar la nota sombra]';
            }
        }

        // 3) Pending topics — extract from plan text (lines starting with - or *)
        const pendingTopics: string[] = [];
        if (lastSessionPlan) {
            const lines = lastSessionPlan.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
                    pendingTopics.push(trimmed.replace(/^[-*•]\s*/, ''));
                }
            }
            // If no bullet points, use the whole plan as a single topic
            if (pendingTopics.length === 0 && lastSessionPlan.trim().length > 0) {
                pendingTopics.push(lastSessionPlan.trim());
            }
        }

        // Audit
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.PATIENT,
            resourceId: patientId,
            patientId,
            success: true,
            details: { type: 'briefing' },
        });

        return {
            patientId,
            patientName: `${patient.firstName} ${patient.lastName}`,
            lastSessionPlan,
            lastSessionDate,
            lastShadowNote,
            lastShadowNoteDate,
            pendingTopics,
        };
    }

    private generateExternalId(): string {
        // Formato: PAT-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PAT-${dateStr}-${random}`;
    }
}
