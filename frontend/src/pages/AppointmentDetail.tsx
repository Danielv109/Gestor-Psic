// =============================================================================
// APPOINTMENT DETAIL PAGE
// View appointment details and perform workflow actions
// =============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentsApi, workflowApi } from '../api';
import { ApiClientError } from '../api/client';
import type { Appointment, WorkflowStatus, WorkflowResult } from '../types';
import { AppointmentStatus } from '../types';
import styles from './AppointmentDetail.module.css';

function getStatusInfo(status: AppointmentStatus) {
    const info: Record<AppointmentStatus, { badge: string; label: string }> = {
        [AppointmentStatus.SCHEDULED]: { badge: 'badge-draft', label: 'Programada' },
        [AppointmentStatus.CONFIRMED]: { badge: 'badge-pending', label: 'Confirmada' },
        [AppointmentStatus.IN_PROGRESS]: { badge: 'badge-pending', label: 'En Curso' },
        [AppointmentStatus.COMPLETED]: { badge: 'badge-signed', label: 'Completada' },
        [AppointmentStatus.CANCELLED]: { badge: 'badge-voided', label: 'Cancelada' },
        [AppointmentStatus.NO_SHOW]: { badge: 'badge-voided', label: 'No Asistió' },
    };
    return info[status];
}

export default function AppointmentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActing, setIsActing] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (id) loadAppointment();
    }, [id]);

    async function loadAppointment() {
        if (!id) return;
        try {
            setIsLoading(true);
            setError('');

            const [apptData, statusData] = await Promise.all([
                appointmentsApi.getAppointmentById(id),
                workflowApi.getWorkflowStatus(id).catch(() => null),
            ]);

            setAppointment(apptData);
            setWorkflowStatus(statusData);
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isNotFound) {
                    setError('Cita no encontrada');
                } else if (err.isForbidden) {
                    setError('No tienes acceso a esta cita');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Error al cargar la cita');
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleAction(
        action: 'confirm' | 'cancel' | 'no-show' | 'start-session',
        reason?: string
    ) {
        if (!id) return;
        try {
            setIsActing(true);
            setError('');
            setMessage('');

            let result: WorkflowResult;

            switch (action) {
                case 'confirm':
                    result = await workflowApi.confirmAppointment(id);
                    break;
                case 'cancel':
                    const cancelReason = reason || window.prompt('Ingresa la razón de cancelación:');
                    if (!cancelReason) {
                        setIsActing(false);
                        return;
                    }
                    result = await workflowApi.cancelAppointment(id, { reason: cancelReason });
                    break;
                case 'no-show':
                    result = await workflowApi.markNoShow(id);
                    break;
                case 'start-session':
                    result = await workflowApi.startSession(id);
                    if (result.session?.id) {
                        navigate(`/sessions/${result.session.id}`);
                        return;
                    }
                    break;
                default:
                    return;
            }

            setMessage(result.message);
            await loadAppointment(); // Refresh data
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isConflict) {
                    setError('La cita ya cambió de estado. Recargando...');
                    await loadAppointment();
                } else {
                    setError(err.message);
                }
            }
        } finally {
            setIsActing(false);
        }
    }

    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="flex items-center justify-center" style={{ padding: '4rem' }}>
                        <div className="spinner" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !appointment) {
        return (
            <div className="page">
                <div className="container">
                    <div className="card">
                        <h2>Error</h2>
                        <p style={{ color: 'var(--color-error)' }}>{error}</p>
                        <button onClick={() => navigate('/appointments')} className="btn btn-secondary">
                            Volver a Citas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!appointment) return null;

    const statusInfo = getStatusInfo(appointment.status);
    const startDate = new Date(appointment.scheduledStart);
    const endDate = new Date(appointment.scheduledEnd);

    // Determine available actions based on current status
    const canConfirm = appointment.status === AppointmentStatus.SCHEDULED;
    const canCancel = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(appointment.status);
    const canMarkNoShow = appointment.status === AppointmentStatus.CONFIRMED;
    const canStartSession = workflowStatus?.canStartSession ??
        appointment.status === AppointmentStatus.CONFIRMED;

    return (
        <div className="page animate-fade-in">
            <div className="container">
                <header className={styles.header}>
                    <div>
                        <div className={styles.headerTop}>
                            <h1 className="page-title">Detalle de Cita</h1>
                            <span className={`badge ${statusInfo.badge}`}>{statusInfo.label}</span>
                        </div>
                        <p className="page-subtitle">
                            {startDate.toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </header>

                {error && (
                    <div className={styles.errorBanner}>
                        {error}
                        <button onClick={() => setError('')}>×</button>
                    </div>
                )}

                {message && (
                    <div className={styles.successBanner}>
                        {message}
                        <button onClick={() => setMessage('')}>×</button>
                    </div>
                )}

                {/* Appointment Info */}
                <div className={styles.infoCard}>
                    <h3>Información de la Cita</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Hora de Inicio</span>
                            <span className={styles.infoValue}>
                                {startDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Hora de Fin</span>
                            <span className={styles.infoValue}>
                                {endDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {appointment.sessionType && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tipo de Sesión</span>
                                <span className={styles.infoValue}>{appointment.sessionType}</span>
                            </div>
                        )}
                        {appointment.patient && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Paciente</span>
                                <span className={styles.infoValue}>
                                    {appointment.patient.firstName} {appointment.patient.lastName}
                                </span>
                            </div>
                        )}
                    </div>

                    {appointment.adminNotes && (
                        <div className={styles.notes}>
                            <span className={styles.infoLabel}>Notas Administrativas</span>
                            <p>{appointment.adminNotes}</p>
                        </div>
                    )}

                    {appointment.cancelReason && (
                        <div className={styles.cancelInfo}>
                            <strong>Razón de Cancelación:</strong>
                            <p>{appointment.cancelReason}</p>
                        </div>
                    )}
                </div>

                {/* Workflow Actions */}
                <div className={styles.actionsCard}>
                    <h3>Acciones del Flujo</h3>

                    <div className={styles.actionButtons}>
                        {canConfirm && (
                            <button
                                onClick={() => handleAction('confirm')}
                                className="btn btn-primary"
                                disabled={isActing}
                            >
                                ✓ Confirmar Cita
                            </button>
                        )}

                        {canStartSession && (
                            <button
                                onClick={() => handleAction('start-session')}
                                className="btn btn-primary"
                                disabled={isActing}
                            >
                                ▶ Iniciar Sesión
                            </button>
                        )}

                        {canMarkNoShow && (
                            <button
                                onClick={() => handleAction('no-show')}
                                className="btn btn-secondary"
                                disabled={isActing}
                            >
                                ⊘ Marcar No Asistió
                            </button>
                        )}

                        {canCancel && (
                            <button
                                onClick={() => handleAction('cancel')}
                                className="btn btn-danger"
                                disabled={isActing}
                            >
                                ✕ Cancelar Cita
                            </button>
                        )}
                    </div>

                    {!canConfirm && !canStartSession && !canMarkNoShow && !canCancel && (
                        <p className={styles.noActionsMessage}>
                            No hay acciones disponibles para esta cita.
                        </p>
                    )}

                    {/* Session link if exists */}
                    {workflowStatus?.sessionId && (
                        <div className={styles.sessionLink}>
                            <button
                                onClick={() => navigate(`/sessions/${workflowStatus.sessionId}`)}
                                className="btn btn-secondary"
                            >
                                Ver Sesión Clínica →
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={() => navigate('/appointments')} className="btn btn-secondary">
                        ← Volver a Citas
                    </button>
                </div>
            </div>
        </div>
    );
}
