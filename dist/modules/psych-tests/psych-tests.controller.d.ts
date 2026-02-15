import { PsychTestsService } from './psych-tests.service';
import { CreateTestResultDto } from './dto/create-test-result.dto';
export declare class PsychTestsController {
    private readonly psychTests;
    constructor(psychTests: PsychTestsService);
    getCatalog(): import("./psych-tests.service").TestCatalogEntry[];
    createResult(patientId: string, dto: CreateTestResultDto, req: any): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string | null;
        notes: string | null;
        testName: string;
        testCode: string | null;
        rawScore: import("@prisma/client/runtime/library").Decimal;
        maxScore: import("@prisma/client/runtime/library").Decimal | null;
        severity: string | null;
        percentile: import("@prisma/client/runtime/library").Decimal | null;
        appliedAt: Date;
    }>;
    getResults(patientId: string, testName?: string): Promise<{
        id: string;
        patientId: string;
        createdAt: Date;
        updatedAt: Date;
        therapistId: string;
        sessionId: string | null;
        notes: string | null;
        testName: string;
        testCode: string | null;
        rawScore: import("@prisma/client/runtime/library").Decimal;
        maxScore: import("@prisma/client/runtime/library").Decimal | null;
        severity: string | null;
        percentile: import("@prisma/client/runtime/library").Decimal | null;
        appliedAt: Date;
    }[]>;
    getEvolution(patientId: string, testName: string): Promise<{
        id: string;
        notes: string | null;
        rawScore: import("@prisma/client/runtime/library").Decimal;
        maxScore: import("@prisma/client/runtime/library").Decimal | null;
        severity: string | null;
        appliedAt: Date;
    }[]>;
    getDistinctTests(patientId: string): Promise<{
        testName: string;
        testCode: string | null;
    }[]>;
    deleteResult(id: string, req: any): Promise<void>;
}
