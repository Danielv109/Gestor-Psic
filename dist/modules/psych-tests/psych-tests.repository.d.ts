import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class PsychTestsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.PsychTestResultUncheckedCreateInput): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string | null;
        notes: string | null;
        testName: string;
        testCode: string | null;
        rawScore: Prisma.Decimal;
        maxScore: Prisma.Decimal | null;
        severity: string | null;
        percentile: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    findById(id: string): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string | null;
        notes: string | null;
        testName: string;
        testCode: string | null;
        rawScore: Prisma.Decimal;
        maxScore: Prisma.Decimal | null;
        severity: string | null;
        percentile: Prisma.Decimal | null;
        appliedAt: Date;
    } | null>;
    findByPatient(patientId: string, testName?: string): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string | null;
        notes: string | null;
        testName: string;
        testCode: string | null;
        rawScore: Prisma.Decimal;
        maxScore: Prisma.Decimal | null;
        severity: string | null;
        percentile: Prisma.Decimal | null;
        appliedAt: Date;
    }[]>;
    getEvolution(patientId: string, testName: string): Promise<{
        id: string;
        notes: string | null;
        rawScore: Prisma.Decimal;
        maxScore: Prisma.Decimal | null;
        severity: string | null;
        appliedAt: Date;
    }[]>;
    delete(id: string): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string | null;
        notes: string | null;
        testName: string;
        testCode: string | null;
        rawScore: Prisma.Decimal;
        maxScore: Prisma.Decimal | null;
        severity: string | null;
        percentile: Prisma.Decimal | null;
        appliedAt: Date;
    }>;
    getDistinctTests(patientId: string): Promise<{
        testName: string;
        testCode: string | null;
    }[]>;
}
