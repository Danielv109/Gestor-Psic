// =============================================================================
// CLINICAL HISTORY API
// =============================================================================

import { get, post, put } from './client';
import type { ClinicalHistory, CreateClinicalHistoryDto, UpdateClinicalHistoryDto } from '../types';

export async function getClinicalHistory(patientId: string): Promise<ClinicalHistory | null> {
    try {
        return await get<ClinicalHistory>(`/clinical-history/patient/${patientId}`);
    } catch {
        return null;
    }
}

export async function createClinicalHistory(dto: CreateClinicalHistoryDto): Promise<ClinicalHistory> {
    return post<ClinicalHistory>('/clinical-history', dto);
}

export async function updateClinicalHistory(id: string, dto: UpdateClinicalHistoryDto): Promise<ClinicalHistory> {
    return put<ClinicalHistory>(`/clinical-history/${id}`, dto);
}
