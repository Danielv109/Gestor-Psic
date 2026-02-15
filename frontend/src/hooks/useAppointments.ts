// =============================================================================
// USE APPOINTMENTS HOOK
// Data fetching logic for appointments - no UI, no business logic
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { appointmentsApi, workflowApi } from '../api';
import { ApiClientError } from '../api/client';
import type { Appointment, WorkflowStatus } from '../types';

interface UseAppointmentsReturn {
    appointments: Appointment[];
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useUpcomingAppointments(): UseAppointmentsReturn {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await appointmentsApi.getUpcomingAppointments();
            setAppointments(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError('Error al cargar citas');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { appointments, isLoading, error, reload: load };
}

export function useAppointmentsByRange(start: string, end: string): UseAppointmentsReturn {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await appointmentsApi.getAppointmentsByRange(start, end);
            setAppointments(data);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError('Error al cargar citas');
            }
        } finally {
            setIsLoading(false);
        }
    }, [start, end]);

    useEffect(() => {
        load();
    }, [load]);

    return { appointments, isLoading, error, reload: load };
}

interface UseAppointmentReturn {
    appointment: Appointment | null;
    workflowStatus: WorkflowStatus | null;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
}

export function useAppointment(id: string | undefined): UseAppointmentReturn {
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            setError(null);
            const [apptData, statusData] = await Promise.all([
                appointmentsApi.getAppointmentById(id),
                workflowApi.getWorkflowStatus(id).catch(() => null),
            ]);
            setAppointment(apptData);
            setWorkflowStatus(statusData);
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isNotFound) setError('Cita no encontrada');
                else if (err.isForbidden) setError('Sin acceso');
                else setError(err.message);
            } else {
                setError('Error al cargar cita');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    return { appointment, workflowStatus, isLoading, error, reload: load };
}
