// =============================================================================
// NEW APPOINTMENT FORM
// Creates a new appointment by selecting a patient and scheduling time
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi, patientsApi } from '../api';
import { ApiClientError } from '../api/client';
import { Card, Button, ErrorMessage } from '../components';
import type { Patient, CreateAppointmentDto } from '../types';
import styles from './PatientForm.module.css';

interface AppointmentFormValues {
    patientId: string;
    scheduledStart: string;
    scheduledEnd: string;
    sessionType: string;
    adminNotes: string;
}

const initialValues: AppointmentFormValues = {
    patientId: '',
    scheduledStart: '',
    scheduledEnd: '',
    sessionType: 'INDIVIDUAL',
    adminNotes: '',
};

export default function NewAppointment() {
    const navigate = useNavigate();
    const [values, setValues] = useState(initialValues);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Load patient list for selector
    useEffect(() => {
        async function loadPatients() {
            try {
                const data = await patientsApi.getPatients();
                setPatients(data);
            } catch {
                setError('No se pudieron cargar los pacientes');
            } finally {
                setIsLoading(false);
            }
        }
        loadPatients();
    }, []);

    function setField(field: keyof AppointmentFormValues, value: string) {
        setValues(prev => ({ ...prev, [field]: value }));

        // Auto-calculate end time (1 hour after start)
        if (field === 'scheduledStart' && value) {
            const start = new Date(value);
            start.setHours(start.getHours() + 1);
            const endStr = start.toISOString().slice(0, 16);
            setValues(prev => ({ ...prev, [field]: value, scheduledEnd: endStr }));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!values.patientId) {
            setError('Selecciona un paciente');
            return;
        }
        if (!values.scheduledStart || !values.scheduledEnd) {
            setError('Ingresa la fecha y hora de inicio y fin');
            return;
        }

        setIsSubmitting(true);
        try {
            const dto: CreateAppointmentDto = {
                patientId: values.patientId,
                scheduledStart: new Date(values.scheduledStart).toISOString(),
                scheduledEnd: new Date(values.scheduledEnd).toISOString(),
                sessionType: values.sessionType || undefined,
                adminNotes: values.adminNotes || undefined,
            };
            await appointmentsApi.createAppointment(dto);
            navigate('/appointments');
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError('Error al crear la cita');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <p>Cargando pacientes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page animate-fade-in">
            <div className="container">
                <header className={styles.header}>
                    <h1 className="page-title">Nueva Cita</h1>
                </header>

                <Card className={styles.formCard}>
                    {error && (
                        <ErrorMessage
                            message={error}
                            onDismiss={() => setError('')}
                        />
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Patient selector */}
                        <div className="form-group">
                            <label className="form-label">Paciente *</label>
                            <select
                                className="form-input"
                                value={values.patientId}
                                onChange={(e) => setField('patientId', e.target.value)}
                                disabled={isSubmitting}
                                required
                            >
                                <option value="">Seleccionar paciente...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.firstName} {p.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.row}>
                            <div className="form-group">
                                <label className="form-label">Inicio *</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={values.scheduledStart}
                                    onChange={(e) => setField('scheduledStart', e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Fin *</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={values.scheduledEnd}
                                    onChange={(e) => setField('scheduledEnd', e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tipo de Sesión</label>
                            <select
                                className="form-input"
                                value={values.sessionType}
                                onChange={(e) => setField('sessionType', e.target.value)}
                                disabled={isSubmitting}
                            >
                                <option value="INDIVIDUAL">Individual</option>
                                <option value="COUPLE">Pareja</option>
                                <option value="FAMILY">Familiar</option>
                                <option value="GROUP">Grupal</option>
                                <option value="ASSESSMENT">Evaluación</option>
                                <option value="FOLLOW_UP">Seguimiento</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notas (opcional)</label>
                            <textarea
                                className="form-input"
                                value={values.adminNotes}
                                onChange={(e) => setField('adminNotes', e.target.value)}
                                disabled={isSubmitting}
                                rows={3}
                                placeholder="Notas administrativas..."
                            />
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                disabled={isSubmitting}
                            >
                                Crear Cita
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/appointments')}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
