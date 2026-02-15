// =============================================================================
// PATIENTS API
// =============================================================================

import { get, post, put, del } from './client';
import type { Patient, CreatePatientDto, UpdatePatientDto } from '../types';

export async function getPatients(): Promise<Patient[]> {
    return get<Patient[]>('/patients');
}

export async function getPatientById(id: string): Promise<Patient> {
    return get<Patient>(`/patients/${id}`);
}

export async function getPatientWithTeam(id: string): Promise<Patient & { clinicalTeam: unknown[] }> {
    return get(`/patients/${id}/team`);
}

export async function createPatient(dto: CreatePatientDto): Promise<Patient> {
    return post<Patient>('/patients', dto);
}

export async function updatePatient(id: string, dto: UpdatePatientDto): Promise<Patient> {
    return put<Patient>(`/patients/${id}`, dto);
}

export async function deletePatient(id: string): Promise<void> {
    return del(`/patients/${id}`);
}
