import { ClinicalHistoryRepository } from './clinical-history.repository';
import { CreateClinicalHistoryDto, UpdateClinicalHistoryDto } from './dto';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Prisma } from '@prisma/client';
export declare class ClinicalHistoryService {
    private readonly repo;
    private readonly auditService;
    constructor(repo: ClinicalHistoryRepository, auditService: AuditService);
    create(dto: CreateClinicalHistoryDto, actor: AuthenticatedUser): Promise<{
        id: string;
        patientId: string;
        therapistId: string;
        openedAt: Date;
        identification: Prisma.JsonValue | null;
        consultation: Prisma.JsonValue | null;
        antecedents: Prisma.JsonValue | null;
        mentalExam: Prisma.JsonValue | null;
        diagnosticImpression: Prisma.JsonValue | null;
        treatmentPlan: Prisma.JsonValue | null;
        therapistSignature: string | null;
        signedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByPatientId(patientId: string, actor: AuthenticatedUser): Promise<{
        id: string;
        patientId: string;
        therapistId: string;
        openedAt: Date;
        identification: Prisma.JsonValue | null;
        consultation: Prisma.JsonValue | null;
        antecedents: Prisma.JsonValue | null;
        mentalExam: Prisma.JsonValue | null;
        diagnosticImpression: Prisma.JsonValue | null;
        treatmentPlan: Prisma.JsonValue | null;
        therapistSignature: string | null;
        signedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, dto: UpdateClinicalHistoryDto, actor: AuthenticatedUser): Promise<{
        id: string;
        patientId: string;
        therapistId: string;
        openedAt: Date;
        identification: Prisma.JsonValue | null;
        consultation: Prisma.JsonValue | null;
        antecedents: Prisma.JsonValue | null;
        mentalExam: Prisma.JsonValue | null;
        diagnosticImpression: Prisma.JsonValue | null;
        treatmentPlan: Prisma.JsonValue | null;
        therapistSignature: string | null;
        signedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
