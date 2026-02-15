import { PrismaService } from '../../prisma/prisma.service';
import { ClinicalHistory, Prisma } from '@prisma/client';
export declare class ClinicalHistoryRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.ClinicalHistoryCreateInput): Promise<ClinicalHistory>;
    findByPatientId(patientId: string): Promise<ClinicalHistory | null>;
    findById(id: string): Promise<ClinicalHistory | null>;
    update(id: string, data: Prisma.ClinicalHistoryUpdateInput): Promise<ClinicalHistory>;
    existsForPatient(patientId: string): Promise<boolean>;
}
