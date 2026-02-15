import { ClinicalHistoryService } from './clinical-history.service';
import { CreateClinicalHistoryDto, UpdateClinicalHistoryDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ClinicalHistoryController {
    private readonly service;
    constructor(service: ClinicalHistoryService);
    create(dto: CreateClinicalHistoryDto, user: AuthenticatedUser): Promise<{
        id: string;
        patientId: string;
        therapistId: string;
        openedAt: Date;
        identification: import("@prisma/client/runtime/library").JsonValue | null;
        consultation: import("@prisma/client/runtime/library").JsonValue | null;
        antecedents: import("@prisma/client/runtime/library").JsonValue | null;
        mentalExam: import("@prisma/client/runtime/library").JsonValue | null;
        diagnosticImpression: import("@prisma/client/runtime/library").JsonValue | null;
        treatmentPlan: import("@prisma/client/runtime/library").JsonValue | null;
        therapistSignature: string | null;
        signedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByPatient(patientId: string, user: AuthenticatedUser): Promise<{
        id: string;
        patientId: string;
        therapistId: string;
        openedAt: Date;
        identification: import("@prisma/client/runtime/library").JsonValue | null;
        consultation: import("@prisma/client/runtime/library").JsonValue | null;
        antecedents: import("@prisma/client/runtime/library").JsonValue | null;
        mentalExam: import("@prisma/client/runtime/library").JsonValue | null;
        diagnosticImpression: import("@prisma/client/runtime/library").JsonValue | null;
        treatmentPlan: import("@prisma/client/runtime/library").JsonValue | null;
        therapistSignature: string | null;
        signedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    update(id: string, dto: UpdateClinicalHistoryDto, user: AuthenticatedUser): Promise<{
        id: string;
        patientId: string;
        therapistId: string;
        openedAt: Date;
        identification: import("@prisma/client/runtime/library").JsonValue | null;
        consultation: import("@prisma/client/runtime/library").JsonValue | null;
        antecedents: import("@prisma/client/runtime/library").JsonValue | null;
        mentalExam: import("@prisma/client/runtime/library").JsonValue | null;
        diagnosticImpression: import("@prisma/client/runtime/library").JsonValue | null;
        treatmentPlan: import("@prisma/client/runtime/library").JsonValue | null;
        therapistSignature: string | null;
        signedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
