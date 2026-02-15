import { PrismaService } from '../../prisma/prisma.service';
import { ClinicalSession, Prisma } from '@prisma/client';
export declare class SessionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<ClinicalSession | null>;
    findByAppointment(appointmentId: string): Promise<ClinicalSession | null>;
    findByTherapist(therapistId: string, params?: {
        skip?: number;
        take?: number;
        isDraft?: boolean;
    }): Promise<ClinicalSession[]>;
    findByPatient(patientId: string): Promise<ClinicalSession[]>;
    create(data: Prisma.ClinicalSessionCreateInput): Promise<ClinicalSession>;
    update(id: string, data: Prisma.ClinicalSessionUpdateInput): Promise<ClinicalSession>;
    createVersion(data: {
        sessionId: string;
        versionNumber: number;
        narrativeSnapshotEncrypted: Buffer;
        narrativeIV: Buffer;
        narrativeKeyId: string;
        changedBy: string;
        changeReason?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        narrativeIV: Buffer;
        narrativeKeyId: string;
        sessionId: string;
        versionNumber: number;
        narrativeSnapshotEncrypted: Buffer;
        changedBy: string;
        changeReason: string | null;
    }>;
    getVersionCount(sessionId: string): Promise<number>;
    getVersions(sessionId: string): Promise<{
        id: string;
        createdAt: Date;
        narrativeIV: Buffer;
        narrativeKeyId: string;
        sessionId: string;
        versionNumber: number;
        narrativeSnapshotEncrypted: Buffer;
        changedBy: string;
        changeReason: string | null;
    }[]>;
    sign(id: string, signatureHash: string): Promise<ClinicalSession>;
    softDelete(id: string): Promise<ClinicalSession>;
}
