// =============================================================================
// SESSIONS API
// =============================================================================

import { get, post, put } from './client';
import type { ClinicalSession, CreateSessionDto, UpdateSessionDto, SignSessionDto } from '../types';

export async function getSessions(isDraft?: boolean): Promise<ClinicalSession[]> {
    // GET /sessions?isDraft=true|false
    // Filter on client if endpoint doesn't support query
    const sessions = await get<ClinicalSession[]>('/sessions');

    if (isDraft === undefined) {
        return sessions;
    }

    // Client-side fallback filter if backend doesn't support query param
    return sessions.filter(s => s.isDraft === isDraft);
}

export async function getSessionsByPatient(patientId: string): Promise<ClinicalSession[]> {
    return get<ClinicalSession[]>(`/sessions/patient/${patientId}`);
}

export async function getSessionById(id: string): Promise<ClinicalSession> {
    return get<ClinicalSession>(`/sessions/${id}`);
}

export async function getSessionVersions(id: string): Promise<unknown[]> {
    return get<unknown[]>(`/sessions/${id}/versions`);
}

export async function createSession(dto: CreateSessionDto): Promise<ClinicalSession> {
    return post<ClinicalSession>('/sessions', dto);
}

export async function updateSession(id: string, dto: UpdateSessionDto): Promise<ClinicalSession> {
    return put<ClinicalSession>(`/sessions/${id}`, dto);
}

// Note: Sign is done via workflow API, not sessions API
// This function is kept for reference but should use workflow.signSession instead
export async function signSession(id: string, dto: SignSessionDto): Promise<ClinicalSession> {
    return post<ClinicalSession>(`/sessions/${id}/sign`, dto);
}
