import { PrismaService } from '../../prisma/prisma.service';
import { Patient, Prisma } from '@prisma/client';
export declare class PatientsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Patient | null>;
    findByExternalId(externalId: string): Promise<Patient | null>;
    findByTherapist(therapistId: string): Promise<Patient[]>;
    findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.PatientWhereInput;
        orderBy?: Prisma.PatientOrderByWithRelationInput;
    }): Promise<Patient[]>;
    count(where?: Prisma.PatientWhereInput): Promise<number>;
    create(data: Prisma.PatientCreateInput): Promise<Patient>;
    update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient>;
    softDelete(id: string): Promise<Patient>;
    findWithCollaborations(id: string): Promise<({
        clinicalTeam: ({
            user: {
                id: string;
                globalRole: import(".prisma/client").$Enums.GlobalRole;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            patientId: string;
            startDate: Date;
            endDate: Date | null;
            isActive: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            contextualRole: import(".prisma/client").$Enums.ContextualRole;
        })[];
    } & {
        id: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        externalId: string;
        dateOfBirth: Date | null;
        gender: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        address: string | null;
        custodianName: string | null;
        custodianPhone: string | null;
        custodianEmail: string | null;
        custodianRelation: string | null;
        emergencyContactName: string | null;
        emergencyPhone: string | null;
        emergencyRelation: string | null;
    }) | null>;
    createCollaboration(data: {
        patientId: string;
        userId: string;
        contextualRole: string;
    }): Promise<{
        id: string;
        patientId: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        contextualRole: import(".prisma/client").$Enums.ContextualRole;
    }>;
}
