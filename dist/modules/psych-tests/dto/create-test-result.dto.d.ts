export declare class CreateTestResultDto {
    testName: string;
    testCode?: string;
    rawScore: number;
    maxScore?: number;
    severity?: string;
    percentile?: number;
    notes?: string;
    appliedAt: string;
    sessionId?: string;
}
