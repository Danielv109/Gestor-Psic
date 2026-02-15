import { PsychTestsRepository } from './psych-tests.repository';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { AuditService } from '../audit/audit.service';
export interface SeverityRange {
    min: number;
    max: number;
    label: string;
}
export interface TestCatalogEntry {
    code: string;
    name: string;
    maxScore: number | null;
    severities: SeverityRange[];
}
export declare const PSYCH_TEST_CATALOG: TestCatalogEntry[];
export declare class PsychTestsService {
    private readonly repo;
    private readonly audit;
    constructor(repo: PsychTestsRepository, audit: AuditService);
    getCatalog(): TestCatalogEntry[];
    create(patientId: string, dto: CreateTestResultDto, user: {
        id: string;
        ip: string;
    }): Promise<{
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
    delete(id: string, user: {
        id: string;
        ip: string;
    }): Promise<void>;
}
