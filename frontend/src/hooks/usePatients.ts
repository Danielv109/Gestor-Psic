// =============================================================================
// USE PATIENTS HOOK
// Data fetching logic for patients - no UI, no business logic
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../api';
import { ApiClientError } from '../api/client';
import type { Patient } from '../types';

interface UsePatientsReturn {
    patients: Patient[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function usePatients(): UsePatientsReturn {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await patientsApi.getPatients();
            setPatients(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError('Error al cargar pacientes');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { patients, isLoading, error, reload: load };
}

interface UsePatientReturn {
    patient: Patient | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function usePatient(id: string | undefined): UsePatientReturn {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await patientsApi.getPatientById(id);
            setPatient(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isNotFound) setError('Paciente no encontrado');
                else if (err.isForbidden) setError('Sin acceso');
                else setError(err.message);
            } else {
                setError('Error al cargar paciente');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    return { patient, isLoading, error, reload: load };
}
