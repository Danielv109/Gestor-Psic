// =============================================================================
// SESSION DETAIL PAGE
// View/edit session with legal state handling
// Sign only via POST /workflow/session/:id/sign
// =============================================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession } from '../hooks';
import { useAuth } from '../auth';
import { canEditSessionNarrative, canShowSignSessionButton, canViewSessionNarrative } from '../utils/roles';
import { sessionsApi, workflowApi } from '../api';
import { ApiClientError } from '../api/client';
import { Spinner, Card, Badge, Button, ErrorMessage } from '../components';
import { SessionLegalStatus, type UpdateSessionDto } from '../types';
import styles from './SessionDetail.module.css';

export default function SessionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { session, isLoading, error, reload } = useSession(id);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [actionError, setActionError] = useState('');
    const [signResult, setSignResult] = useState<{ hash: string } | null>(null);

    // Form state
    const [narrative, setNarrative] = useState('');

    // Derived permissions (from backend response, NOT role)
    const isLocked = session?.isLocked ?? false;
    const legalStatus = session?.legalStatus ?? SessionLegalStatus.DRAFT;

    // Can edit based on BACKEND state, not just role
    const isEditableLegalStatus = [SessionLegalStatus.DRAFT, SessionLegalStatus.PENDING_REVIEW].includes(legalStatus);
    const backendAllowsEdit = isEditableLegalStatus && !isLocked;

    // UI permission (role-based) AND backend permission
    const canEdit = user ? canEditSessionNarrative(user.globalRole) && backendAllowsEdit : false;
    const canSign = user ? canShowSignSessionButton(user.globalRole) && legalStatus === SessionLegalStatus.PENDING_REVIEW && !isLocked : false;
    const canViewNarrative = user ? canViewSessionNarrative(user.globalRole) : false;

    // Start editing
    function handleEdit() {
        if (!session || !canEdit) return;
        setNarrative(session.narrative ?? '');
        setIsEditing(true);
        setActionError('');
    }

    // Save narrative - always call API, let backend validate
    async function handleSave() {
        if (!id) return;

        setIsSaving(true);
        setActionError('');

        try {
            const dto: UpdateSessionDto = {
                clinicalNarrative: { additionalNotes: narrative }
            };
            await sessionsApi.updateSession(id, dto);
            setIsEditing(false);
            reload();
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isConflict) {
                    // 409 - Legal state conflict
                    setActionError('No se puede editar: la sesión ya cambió de estado. Recargando...');
                    setTimeout(() => reload(), 2000);
                } else if (err.isLocked) {
                    // 423 - Legal hold
                    setActionError('Esta sesión está bloqueada por retención legal.');
                } else {
                    setActionError(err.message);
                }
            } else {
                setActionError('Error al guardar');
            }
        } finally {
            setIsSaving(false);
        }
    }

    // Sign session - ONLY via /workflow/session/:id/sign
    async function handleSign() {
        if (!id || !canSign) return;

        // IRREVERSIBLE confirmation
        const confirmed = window.confirm(
            '⚠️ ATENCIÓN: Esta acción es IRREVERSIBLE.\n\n' +
            'Al firmar digitalmente esta sesión:\n' +
            '• Se generará un hash criptográfico permanente\n' +
            '• La narrativa ya no podrá modificarse\n' +
            '• El documento quedará legalmente sellado\n\n' +
            '¿Estás seguro de continuar?'
        );

        if (!confirmed) return;

        setIsSigning(true);
        setActionError('');

        try {
            const result = await workflowApi.signSession(id, { signatureConfirmation: 'CONFIRMO_FIRMA' });
            setSignResult({ hash: result.signatureHash ?? 'Firmado' });
            reload();
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isConflict) {
                    // 409 - Already signed or wrong state
                    setActionError('No se puede firmar: ' + err.message);
                } else if (err.isLocked) {
                    // 423 - Legal hold
                    setActionError('Esta sesión está bloqueada por retención legal.');
                } else if (err.isForbidden) {
                    // 403 - Not owner/not allowed
                    setActionError('No tienes permiso para firmar esta sesión.');
                } else {
                    setActionError(err.message);
                }
            } else {
                setActionError('Error al firmar');
            }
        } finally {
            setIsSigning(false);
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
                        <p>Cargando sesión...</p>
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
                            <Button onClick={() => navigate('/sessions')} variant="ghost">
                                Volver a Sesiones
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // =============================================================================
    // NO DATA
    // =============================================================================
    if (!session) {
        return (
            <div className="page">
                <div className="container">
                    <Card>
                        <p>Sesión no encontrada</p>
                        <Button onClick={() => navigate('/sessions')} variant="secondary">
                            Volver a Sesiones
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    // =============================================================================
    // RENDER
    // =============================================================================
    const statusInfo = getLegalStatusInfo(legalStatus);

    return (
        <div className="page animate-fade-in">
            <div className="container">
                {/* Header */}
                <header className={styles.header}>
                    <div>
                        <h1 className="page-title">Sesión Clínica</h1>
                        <p className={styles.headerDate}>
                            {new Date(session.sessionDate ?? session.startedAt).toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <div className={styles.statusBadges}>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {isLocked && <Badge variant="voided">🔒 Bloqueada</Badge>}
                    </div>
                </header>

                {/* Action Error */}
                {actionError && (
                    <ErrorMessage message={actionError} onDismiss={() => setActionError('')} />
                )}

                {/* Sign Success */}
                {signResult && (
                    <Card className={styles.signSuccess}>
                        <h3>✓ Sesión Firmada Exitosamente</h3>
                        <p>Hash criptográfico:</p>
                        <code className={styles.hash}>{signResult.hash}</code>
                        <p className={styles.hashNote}>
                            Este hash garantiza la integridad del documento según NOM-004-SSA3.
                        </p>
                    </Card>
                )}

                {/* Patient Info */}
                {session.patient && (
                    <Card className={styles.infoCard}>
                        <h3>Paciente</h3>
                        <Link to={`/patients/${session.patient.id}`} className={styles.patientLink}>
                            {session.patient.firstName} {session.patient.lastName}
                        </Link>
                    </Card>
                )}

                {/* Session Info */}
                <Card className={styles.infoCard}>
                    <h3>Información</h3>
                    <div className={styles.infoGrid}>
                        {session.sessionType && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Tipo</span>
                                <span className={styles.infoValue}>{session.sessionType}</span>
                            </div>
                        )}
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Duración</span>
                            <span className={styles.infoValue}>{session.durationMinutes ?? 0} min</span>
                        </div>
                        {session.signedAt && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Firmada</span>
                                <span className={styles.infoValue}>
                                    {new Date(session.signedAt).toLocaleString('es-MX')}
                                </span>
                            </div>
                        )}
                        {session.contentHash && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Hash</span>
                                <code className={styles.infoHash}>{session.contentHash.slice(0, 16)}...</code>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Narrative */}
                <Card className={styles.narrativeCard}>
                    <div className={styles.narrativeHeader}>
                        <h3>Narrativa Clínica</h3>
                        {!backendAllowsEdit && (
                            <span className={styles.readOnlyLabel}>Solo lectura</span>
                        )}
                    </div>

                    {!canViewNarrative ? (
                        <p className={styles.noAccess}>No tienes acceso a ver la narrativa clínica.</p>
                    ) : isEditing ? (
                        <div className={styles.editForm}>
                            <textarea
                                value={narrative}
                                onChange={(e) => setNarrative(e.target.value)}
                                className={styles.narrativeInput}
                                rows={12}
                                disabled={isSaving}
                                placeholder="Escribe la narrativa de la sesión..."
                            />
                            <div className={styles.editActions}>
                                <Button onClick={handleSave} isLoading={isSaving}>
                                    Guardar
                                </Button>
                                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.narrativeContent}>
                                {session.narrative ? (
                                    <p>{session.narrative}</p>
                                ) : (
                                    <p className={styles.emptyNarrative}>No hay narrativa registrada.</p>
                                )}
                            </div>
                            {canEdit && !isLocked && (
                                <Button onClick={handleEdit} variant="secondary" size="sm">
                                    Editar Narrativa
                                </Button>
                            )}
                        </>
                    )}
                </Card>

                {/* Actions */}
                <Card className={styles.actionsCard}>
                    <h3>Acciones</h3>

                    {/* Sign Button - Only for PENDING_REVIEW and not locked */}
                    {canSign && (
                        <div className={styles.signSection}>
                            <p className={styles.signWarning}>
                                ⚠️ Firmar digitalmente esta sesión es una acción irreversible.
                            </p>
                            <Button
                                onClick={handleSign}
                                isLoading={isSigning}
                                variant="primary"
                            >
                                ✍️ Firmar Sesión
                            </Button>
                        </div>
                    )}

                    {/* No addendum - endpoint doesn't exist */}
                    {/* Show info message for signed sessions */}
                    {[SessionLegalStatus.SIGNED, SessionLegalStatus.AMENDED].includes(legalStatus) && (
                        <p className={styles.signedNote}>
                            Esta sesión está firmada y no puede modificarse.
                        </p>
                    )}

                    {isLocked && (
                        <p className={styles.lockedNote}>
                            🔒 Esta sesión está bloqueada por retención legal.
                        </p>
                    )}
                </Card>

                {/* Back button */}
                <div className={styles.footer}>
                    <Button onClick={() => navigate('/sessions')} variant="ghost">
                        ← Volver a Sesiones
                    </Button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// HELPERS
// =============================================================================
function getLegalStatusInfo(status: SessionLegalStatus): { variant: 'draft' | 'pending' | 'signed' | 'amended' | 'voided'; label: string } {
    const map: Record<SessionLegalStatus, { variant: 'draft' | 'pending' | 'signed' | 'amended' | 'voided'; label: string }> = {
        [SessionLegalStatus.DRAFT]: { variant: 'draft', label: 'Borrador' },
        [SessionLegalStatus.PENDING_REVIEW]: { variant: 'pending', label: 'Pendiente de Revisión' },
        [SessionLegalStatus.SIGNED]: { variant: 'signed', label: 'Firmada' },
        [SessionLegalStatus.AMENDED]: { variant: 'amended', label: 'Enmendada' },
        [SessionLegalStatus.VOIDED]: { variant: 'voided', label: 'Anulada' },
    };
    return map[status];
}
