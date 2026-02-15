// =============================================================================
// APPOINTMENTS PAGE
// List with loading, empty, error states
// =============================================================================

import { Link } from 'react-router-dom';
import { useUpcomingAppointments } from '../hooks';
import { useAuth } from '../auth';
import { canShowCreateAppointmentButton } from '../utils/roles';
import { Spinner, Card, Badge, Button, ErrorMessage } from '../components';
import { AppointmentStatus, type Appointment } from '../types';
import styles from './Appointments.module.css';

export default function Appointments() {
    const { user } = useAuth();
    const { appointments, isLoading, error, reload } = useUpcomingAppointments();

    // =============================================================================
    // LOADING STATE
    // =============================================================================
    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <div className={styles.loadingContainer}>
                        <Spinner size="lg" />
                        <p>Cargando citas...</p>
                    </div>
                </div>
            </div>
        );
    }

    // =============================================================================
    // ERROR STATE
    // =============================================================================
    if (error) {
        return (
            <div className="page">
                <div className="container">
                    <Card>
                        <ErrorMessage message={error} />
                        <Button onClick={reload} variant="secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Reintentar
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // =============================================================================
    // RENDER
    // =============================================================================
    return (
        <div className="page animate-fade-in">
            <div className="container">
                {/* Header */}
                <header className={styles.header}>
                    <div>
                        <h1 className="page-title">Citas</h1>
                        <p className="page-subtitle">
                            {appointments.length} cita{appointments.length !== 1 ? 's' : ''} programada{appointments.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {user && canShowCreateAppointmentButton(user.globalRole) && (
                        <Link to="/appointments/new" className="btn btn-primary">
                            + Nueva Cita
                        </Link>
                    )}
                </header>

                {/* Empty State */}
                {appointments.length === 0 ? (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📅</div>
                        <h3>No hay citas programadas</h3>
                        <p>Las próximas citas aparecerán aquí.</p>
                        {user && canShowCreateAppointmentButton(user.globalRole) && (
                            <Link to="/appointments/new" className="btn btn-primary">
                                Crear Cita
                            </Link>
                        )}
                    </Card>
                ) : (
                    /* Appointments List */
                    <div className={styles.list}>
                        {appointments.map(appointment => (
                            <AppointmentCard key={appointment.id} appointment={appointment} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// APPOINTMENT CARD COMPONENT
// =============================================================================
interface AppointmentCardProps {
    appointment: Appointment;
}

function AppointmentCard({ appointment }: AppointmentCardProps) {
    const startDate = new Date(appointment.scheduledStart);
    const statusInfo = getStatusInfo(appointment.status);

    return (
        <Link to={`/appointments/${appointment.id}`} className={styles.card}>
            <div className={styles.cardDateTime}>
                <span className={styles.date}>
                    {startDate.toLocaleDateString('es-MX', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
                <span className={styles.time}>
                    {startDate.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>

            <div className={styles.cardMain}>
                {appointment.patient && (
                    <span className={styles.patientName}>
                        {appointment.patient.firstName} {appointment.patient.lastName}
                    </span>
                )}
                {appointment.sessionType && (
                    <span className={styles.sessionType}>{appointment.sessionType}</span>
                )}
            </div>

            <div className={styles.cardStatus}>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <span className={styles.arrow}>→</span>
            </div>
        </Link>
    );
}

function getStatusInfo(status: AppointmentStatus): { variant: 'draft' | 'pending' | 'signed' | 'voided'; label: string } {
    const map: Record<AppointmentStatus, { variant: 'draft' | 'pending' | 'signed' | 'voided'; label: string }> = {
        [AppointmentStatus.SCHEDULED]: { variant: 'draft', label: 'Programada' },
        [AppointmentStatus.CONFIRMED]: { variant: 'pending', label: 'Confirmada' },
        [AppointmentStatus.IN_PROGRESS]: { variant: 'pending', label: 'En Curso' },
        [AppointmentStatus.COMPLETED]: { variant: 'signed', label: 'Completada' },
        [AppointmentStatus.CANCELLED]: { variant: 'voided', label: 'Cancelada' },
        [AppointmentStatus.NO_SHOW]: { variant: 'voided', label: 'No Asistió' },
    };
    return map[status];
}
