// =============================================================================
// PATIENT DETAIL PAGE
// View/edit patient with proper states
// =============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePatient, usePatientSessions } from '../hooks';
import { useAuth } from '../auth';
import { canEditPatientForm } from '../utils/roles';
import { patientsApi, clinicalHistoryApi } from '../api';
import { ApiClientError } from '../api/client';
import { Spinner, Card, Badge, Button, ErrorMessage } from '../components';
import type { UpdatePatientDto, ClinicalHistory } from '../types';
import { SessionLegalStatus } from '../types';
import styles from './PatientDetail.module.css';

export default function PatientDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { patient, isLoading, error, reload } = usePatient(id);
    const { sessions, isLoading: sessionsLoading } = usePatientSessions(id);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [clinicalHistory, setClinicalHistory] = useState<ClinicalHistory | null>(null);
    const [chLoading, setChLoading] = useState(true);

    // Fetch clinical history
    useEffect(() => {
        if (!id) return;
        setChLoading(true);
        clinicalHistoryApi.getClinicalHistory(id)
            .then(h => setClinicalHistory(h))
            .catch(() => { })
            .finally(() => setChLoading(false));
    }, [id]);

    // Form state
    const [formData, setFormData] = useState<Partial<UpdatePatientDto>>({});

    const canEdit = user ? canEditPatientForm(user.globalRole) : false;

    // Start editing
    function handleEdit() {
        if (!patient) return;
        setFormData({
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.contactEmail ?? '',
            phone: patient.contactPhone ?? '',
        });
        setIsEditing(true);
        setSaveError('');
    }

    // Save changes - always call API, let backend validate
    async function handleSave() {
        if (!id || !formData) return;

        setIsSaving(true);
        setSaveError('');

        try {
            await patientsApi.updatePatient(id, formData);
            setIsEditing(false);
            reload();
        } catch (err) {
            if (err instanceof ApiClientError) {
                setSaveError(err.message);
            } else {
                setSaveError('Error al guardar');
            }
        } finally {
            setIsSaving(false);
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
                        <p>Cargando paciente...</p>
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
                    <Card className={styles.errorCard}>
                        <ErrorMessage message={error} />
                        <div className={styles.errorActions}>
                            <Button onClick={reload} variant="secondary">Reintentar</Button>
                            <Button onClick={() => navigate('/patients')} variant="ghost">
                                Volver a Pacientes
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // =============================================================================
    // NO DATA (should not happen if no error, but defensive)
    // =============================================================================
    if (!patient) {
        return (
            <div className="page">
                <div className="container">
                    <Card>
                        <p>Paciente no encontrado</p>
                        <Button onClick={() => navigate('/patients')} variant="secondary">
                            Volver a Pacientes
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
                        <h1 className="page-title">
                            {patient.firstName} {patient.lastName}
                        </h1>
                        <div className={styles.badges}>
                            {patient.isMinor && <Badge variant="pending">Menor de edad</Badge>}
                            {!patient.isActive && <Badge variant="voided">Inactivo</Badge>}
                            {patient.isActive && <Badge variant="signed">Activo</Badge>}
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        {canEdit && !isEditing && (
                            <Button onClick={handleEdit}>Editar</Button>
                        )}
                    </div>
                </header>

                {/* Edit Form or Info Display */}
                <Card className={styles.infoCard}>
                    {saveError && <ErrorMessage message={saveError} onDismiss={() => setSaveError('')} />}

                    {isEditing ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSave();
                            }}
                            className={styles.form}
                        >
                            <div className="form-group">
                                <label className="form-label">Nombre</label>
                                <input
                                    className="form-input"
                                    value={formData.firstName ?? ''}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Apellido</label>
                                <input
                                    className="form-input"
                                    value={formData.lastName ?? ''}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email ?? ''}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teléfono</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={formData.phone ?? ''}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <Button type="submit" isLoading={isSaving}>
                                    Guardar
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className={styles.infoGrid}>
                            <InfoItem label="Fecha de nacimiento" value={
                                patient.dateOfBirth
                                    ? new Date(patient.dateOfBirth).toLocaleDateString('es-MX')
                                    : '—'
                            } />
                            <InfoItem label="Email" value={patient.contactEmail ?? '—'} />
                            <InfoItem label="Teléfono" value={patient.contactPhone ?? '—'} />
                            <InfoItem label="Registrado" value={
                                new Date(patient.createdAt).toLocaleDateString('es-MX')
                            } />
                        </div>
                    )}
                </Card>

                {/* Sessions History Timeline */}
                <section className={styles.sessionsSection}>
                    <h2>Línea de Tiempo — Historial Clínico</h2>

                    {(sessionsLoading || chLoading) ? (
                        <div className={styles.sessionsLoading}>
                            <Spinner size="sm" />
                            <span>Cargando historial...</span>
                        </div>
                    ) : (
                        <div className={styles.timeline}>
                            {/* Clinical History — ALWAYS FIRST */}
                            <Link to={`/patients/${id}/clinical-history`} className={styles.timelineItem}>
                                <div className={styles.timelineDot}>
                                    <div className={styles.dot} data-status={clinicalHistory ? 'SIGNED' : 'DRAFT'} />
                                    {sessions.length > 0 && <div className={styles.timelineLine} />}
                                </div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineHeader}>
                                        <span className={styles.timelineDate}>
                                            📋 Historia Clínica Psicológica
                                        </span>
                                        <Badge variant={clinicalHistory ? 'signed' : 'draft'}>
                                            {clinicalHistory ? 'Completada' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                    <div className={styles.timelineDetails}>
                                        {clinicalHistory ? (
                                            <span>Apertura: {new Date(clinicalHistory.openedAt).toLocaleDateString('es-MX')}</span>
                                        ) : (
                                            <span>Click para crear la historia clínica de este paciente</span>
                                        )}
                                        {clinicalHistory?.diagnosticImpression?.diagnosticCode && (
                                            <span>Código: {clinicalHistory.diagnosticImpression.diagnosticCode}</span>
                                        )}
                                    </div>
                                    {clinicalHistory?.consultation?.patientStatement && (
                                        <p className={styles.timelineNarrative}>
                                            Motivo: {clinicalHistory.consultation.patientStatement.substring(0, 100)}
                                            {clinicalHistory.consultation.patientStatement.length > 100 ? '...' : ''}
                                        </p>
                                    )}
                                </div>
                                <span className={styles.sessionArrow}>→</span>
                            </Link>

                            {/* Sessions */}
                            {sessions.map((session, idx) => (
                                <Link key={session.id} to={`/sessions/${session.id}`} className={styles.timelineItem}>
                                    <div className={styles.timelineDot}>
                                        <div className={styles.dot} data-status={session.legalStatus} />
                                        {idx < sessions.length - 1 && <div className={styles.timelineLine} />}
                                    </div>
                                    <div className={styles.timelineContent}>
                                        <div className={styles.timelineHeader}>
                                            <span className={styles.timelineDate}>
                                                {new Date(session.sessionDate ?? session.startedAt).toLocaleDateString('es-MX', {
                                                    weekday: 'short',
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            <Badge variant={getLegalStatusVariant(session.legalStatus)}>
                                                {getLegalStatusLabel(session.legalStatus)}
                                            </Badge>
                                        </div>
                                        <div className={styles.timelineDetails}>
                                            {session.startedAt && (
                                                <span>
                                                    🕐 {new Date(session.startedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                            {session.durationMinutes && (
                                                <span>⏱ {session.durationMinutes} min</span>
                                            )}
                                            {session.sessionType && (
                                                <span>📋 {session.sessionType}</span>
                                            )}
                                        </div>
                                        {session.clinicalNarrative?.assessment && (
                                            <p className={styles.timelineNarrative}>
                                                {session.clinicalNarrative.assessment.substring(0, 120)}
                                                {session.clinicalNarrative.assessment.length > 120 ? '...' : ''}
                                            </p>
                                        )}
                                    </div>
                                    <span className={styles.sessionArrow}>→</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Back button */}
                <div className={styles.footer}>
                    <Button onClick={() => navigate('/patients')} variant="ghost">
                        ← Volver a Pacientes
                    </Button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================
function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    );
}

function getLegalStatusVariant(status: SessionLegalStatus): 'draft' | 'pending' | 'signed' | 'amended' | 'voided' {
    const map: Record<SessionLegalStatus, 'draft' | 'pending' | 'signed' | 'amended' | 'voided'> = {
        [SessionLegalStatus.DRAFT]: 'draft',
        [SessionLegalStatus.PENDING_REVIEW]: 'pending',
        [SessionLegalStatus.SIGNED]: 'signed',
        [SessionLegalStatus.AMENDED]: 'amended',
        [SessionLegalStatus.VOIDED]: 'voided',
    };
    return map[status];
}

function getLegalStatusLabel(status: SessionLegalStatus): string {
    const map: Record<SessionLegalStatus, string> = {
        [SessionLegalStatus.DRAFT]: 'Borrador',
        [SessionLegalStatus.PENDING_REVIEW]: 'Revisión',
        [SessionLegalStatus.SIGNED]: 'Firmada',
        [SessionLegalStatus.AMENDED]: 'Enmendada',
        [SessionLegalStatus.VOIDED]: 'Anulada',
    };
    return map[status];
}
