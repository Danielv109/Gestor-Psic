// =============================================================================
// PATIENTS PAGE
// List with loading, empty, error states
// =============================================================================

import { Link } from 'react-router-dom';
import { usePatients } from '../hooks';
import { useAuth } from '../auth';
import { canShowCreatePatientButton, canShowDeletePatientButton } from '../utils/roles';
import { patientsApi } from '../api';
import { ApiClientError } from '../api/client';
import { Spinner, Card, Badge, Button, ErrorMessage } from '../components';
import type { Patient } from '../types';
import styles from './Patients.module.css';

export default function Patients() {
    const { user } = useAuth();
    const { patients, isLoading, error, reload } = usePatients();

    // Delete handler - always call API, let backend validate
    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este paciente?')) return;

        try {
            await patientsApi.deletePatient(id);
            reload(); // Refresh list
        } catch (err) {
            if (err instanceof ApiClientError) {
                alert(err.message);
            }
        }
    }

    // =============================================================================
    // LOADING STATE
    // =============================================================================
    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <div className={styles.loadingContainer}>
                        <Spinner size="lg" />
                        <p>Cargando pacientes...</p>
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
                        <h1 className="page-title">Pacientes</h1>
                        <p className="page-subtitle">
                            {patients.length} paciente{patients.length !== 1 ? 's' : ''} registrado{patients.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {user && canShowCreatePatientButton(user.globalRole) && (
                        <Link to="/patients/new" className="btn btn-primary">
                            + Nuevo Paciente
                        </Link>
                    )}
                </header>

                {/* Empty State */}
                {patients.length === 0 ? (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <h3>No hay pacientes registrados</h3>
                        <p>Comienza agregando tu primer paciente.</p>
                        {user && canShowCreatePatientButton(user.globalRole) && (
                            <Link to="/patients/new" className="btn btn-primary">
                                Agregar Paciente
                            </Link>
                        )}
                    </Card>
                ) : (
                    /* Patient Grid */
                    <div className={styles.grid}>
                        {patients.map(patient => (
                            <PatientCard
                                key={patient.id}
                                patient={patient}
                                canDelete={user ? canShowDeletePatientButton(user.globalRole) : false}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// PATIENT CARD COMPONENT
// =============================================================================
interface PatientCardProps {
    patient: Patient;
    canDelete: boolean;
    onDelete: (id: string) => void;
}

function PatientCard({ patient, canDelete, onDelete }: PatientCardProps) {
    return (
        <Card className={styles.card}>
            <div className={styles.cardHeader}>
                <Link to={`/patients/${patient.id}`} className={styles.name}>
                    {patient.firstName} {patient.lastName}
                </Link>
                {patient.isMinor && <Badge variant="pending">Menor</Badge>}
                {!patient.isActive && <Badge variant="voided">Inactivo</Badge>}
            </div>

            <div className={styles.meta}>
                {patient.email && <p className={styles.metaItem}>📧 {patient.email}</p>}
                {patient.phone && <p className={styles.metaItem}>📞 {patient.phone}</p>}
                {patient.dateOfBirth && (
                    <p className={styles.metaItem}>
                        🎂 {new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}
                    </p>
                )}
            </div>

            <div className={styles.actions}>
                <Link to={`/patients/${patient.id}`}>
                    <Button variant="secondary" size="sm">Ver</Button>
                </Link>
                {canDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(patient.id)}>
                        Eliminar
                    </Button>
                )}
            </div>
        </Card>
    );
}
