import { apiClient } from './client';
import type { PsychTestResult, TestCatalogEntry } from '../types';

export const psychTestsApi = {
    /** Get the catalog of common psych tests */
    getCatalog: () =>
        apiClient<TestCatalogEntry[]>('/psych-tests/catalog'),

    /** Get test results for a patient */
    getByPatient: (patientId: string, testName?: string) => {
        const params = testName ? `?testName=${encodeURIComponent(testName)}` : '';
        return apiClient<PsychTestResult[]>(`/patients/${patientId}/test-results${params}`);
    },

    /** Get evolution data for a specific test */
    getEvolution: (patientId: string, testName: string) =>
        apiClient<PsychTestResult[]>(
            `/patients/${patientId}/test-results/evolution?testName=${encodeURIComponent(testName)}`,
        ),

    /** Get distinct test names for a patient */
    getDistinctTests: (patientId: string) =>
        apiClient<{ testName: string; testCode: string }[]>(
            `/patients/${patientId}/test-results/tests`,
        ),

    /** Create a new test result */
    create: (patientId: string, data: {
        testName: string;
        testCode?: string;
        rawScore: number;
        maxScore?: number;
        severity?: string;
        percentile?: number;
        notes?: string;
        appliedAt: string;
        sessionId?: string;
    }) =>
        apiClient<PsychTestResult>(`/patients/${patientId}/test-results`, {
            method: 'POST',
            body: data,
        }),

    /** Delete a test result */
    delete: (id: string) =>
        apiClient<void>(`/test-results/${id}`, { method: 'DELETE' }),
};
