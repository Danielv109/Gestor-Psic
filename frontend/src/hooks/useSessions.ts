// =============================================================================
// USE SESSIONS HOOK
// Data fetching logic for sessions - no UI, no business logic
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { sessionsApi } from '../api';
import { ApiClientError } from '../api/client';
import type { ClinicalSession } from '../types';

interface UseSessionsReturn {
    sessions: ClinicalSession[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
    const [sessions, setSessions] = useState<ClinicalSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await sessionsApi.getSessions();
            setSessions(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError('Error al cargar sesiones');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { sessions, isLoading, error, reload: load };
}

interface UseSessionReturn {
    session: ClinicalSession | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useSession(id: string | undefined): UseSessionReturn {
    const [session, setSession] = useState<ClinicalSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await sessionsApi.getSessionById(id);
            setSession(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isNotFound) setError('Sesión no encontrada');
                else if (err.isForbidden) setError('Sin acceso');
                else setError(err.message);
            } else {
                setError('Error al cargar sesión');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    return { session, isLoading, error, reload: load };
}

export function usePatientSessions(patientId: string | undefined): UseSessionsReturn {
    const [sessions, setSessions] = useState<ClinicalSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!patientId) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await sessionsApi.getSessionsByPatient(patientId);
            setSessions(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError('Error al cargar sesiones');
            }
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        load();
    }, [load]);

    return { sessions, isLoading, error, reload: load };
}
