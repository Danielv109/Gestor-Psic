import { PrismaService } from '../../prisma/prisma.service';
import { ClinicalCollaboration, ContextualRole } from '@prisma/client';
export declare class CollaborationsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findActiveCollaboration(userId: string, patientId: string): Promise<ClinicalCollaboration | null>;
    findByPatient(patientId: string): Promise<ClinicalCollaboration[]>;
    findByUser(userId: string): Promise<ClinicalCollaboration[]>;
    create(data: {
        userId: string;
        patientId: string;
        contextualRole: ContextualRole;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ClinicalCollaboration>;
    deactivate(id: string): Promise<ClinicalCollaboration>;
    hasRole(userId: string, patientId: string, roles: ContextualRole[]): Promise<boolean>;
}
