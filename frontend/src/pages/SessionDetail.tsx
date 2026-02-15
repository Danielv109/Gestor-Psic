// =============================================================================
// SESSION DETAIL PAGE
// View/edit session with SOAP narrative, live timer, legal state handling
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession } from '../hooks';
import { useAuth } from '../auth';
import { canEditSessionNarrative, canShowSignSessionButton, canViewSessionNarrative } from '../utils/roles';
import { sessionsApi, workflowApi } from '../api';
import { ApiClientError } from '../api/client';
import { Spinner, Card, Badge, Button, ErrorMessage } from '../components';
import { SessionLegalStatus, type ClinicalNarrative, type UpdateSessionDto } from '../types';
import styles from './SessionDetail.module.css';

export default function SessionDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { session, isLoading, error, reload } = useSession(id);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [actionError, setActionError] = useState('');
    const [signResult, setSignResult] = useState<{ hash: string } | null>(null);

    // SOAP form state
    const [subjective, setSubjective] = useState('');
    const [objective, setObjective] = useState('');
    const [assessment, setAssessment] = useState('');
    const [plan, setPlan] = useState('');
    const [additionalNotes, setAdditionalNotes] = useState('');

    // Live duration timer
    const [liveDuration, setLiveDuration] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Calculate live duration
    useEffect(() => {
        if (!session?.startedAt || session?.endedAt) return;

        function tick() {
            const started = new Date(session!.startedAt).getTime();
            const now = Date.now();
            setLiveDuration(Math.floor((now - started) / 60000));
        }

        tick(); // immediate
        timerRef.current = setInterval(tick, 60000); // every minute

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [session?.startedAt, session?.endedAt]);

    // Auto-finalize: end session 1 minute after scheduledEnd
    const autoFinalizeFiredRef = useRef(false);
    useEffect(() => {
        if (!session || session.endedAt || !session.appointment?.scheduledEnd) return;
        if (autoFinalizeFiredRef.current) return;

        const deadline = new Date(session.appointment.scheduledEnd).getTime() + 60_000; // +1 min
        const remaining = deadline - Date.now();

        if (remaining <= 0) {
            // Already past deadline — fire immediately
            triggerAutoFinalize();
            return;
        }

        const timeout = setTimeout(triggerAutoFinalize, remaining);
        return () => clearTimeout(timeout);

        async function triggerAutoFinalize() {
            if (autoFinalizeFiredRef.current) return;
            autoFinalizeFiredRef.current = true;

            try {
                const endedAt = new Date().toISOString();

                // Build narrative from current form state (if user was editing)
                const clinicalNarrative: ClinicalNarrative = {};
                if (subjective.trim()) clinicalNarrative.subjectiveReport = subjective.trim();
                if (objective.trim()) clinicalNarrative.objectiveObservation = objective.trim();
                if (assessment.trim()) clinicalNarrative.assessment = assessment.trim();
                if (plan.trim()) clinicalNarrative.plan = plan.trim();
                if (additionalNotes.trim()) clinicalNarrative.additionalNotes = additionalNotes.trim();

                const dto: UpdateSessionDto = { endedAt };
                if (Object.keys(clinicalNarrative).length > 0) {
                    dto.clinicalNarrative = clinicalNarrative;
                }

                await sessionsApi.updateSession(session!.id, dto);
                setIsEditing(false);
                reload();

                // Show alert after state update
                setTimeout(() => {
                    alert(
                        '⏰ Tiempo de sesión finalizado\n\n' +
                        'La sesión se ha finalizado automáticamente porque se cumplió el tiempo programado.\n' +
                        'La narrativa y duración han sido guardadas.'
                    );
                }, 300);
            } catch {
                setActionError('No se pudo finalizar la sesión automáticamente.');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.id, session?.endedAt, session?.appointment?.scheduledEnd]);

    // Derived permissions
    const isLocked = session?.isLocked ?? false;
    const legalStatus = session?.legalStatus ?? SessionLegalStatus.DRAFT;
    const isEditableLegalStatus = [SessionLegalStatus.DRAFT, SessionLegalStatus.PENDING_REVIEW].includes(legalStatus);
    const backendAllowsEdit = isEditableLegalStatus && !isLocked;
    const canEdit = user ? canEditSessionNarrative(user.globalRole) && backendAllowsEdit : false;
    const canSign = user ? canShowSignSessionButton(user.globalRole) && legalStatus === SessionLegalStatus.PENDING_REVIEW && !isLocked : false;
    const canViewNarrative = user ? canViewSessionNarrative(user.globalRole) : false;
    const isActive = !session?.endedAt && legalStatus === SessionLegalStatus.DRAFT;

    // Start editing — populate all SOAP fields from current narrative
    function handleEdit() {
        if (!session || !canEdit) return;
        const n = session.clinicalNarrative;
        setSubjective(n?.subjectiveReport ?? '');
        setObjective(n?.objectiveObservation ?? '');
        setAssessment(n?.assessment ?? '');
        setPlan(n?.plan ?? '');
        setAdditionalNotes(n?.additionalNotes ?? '');
        setIsEditing(true);
        setActionError('');
    }

    // Save narrative — send full SOAP structure
    async function handleSave() {
        if (!id) return;

        setIsSaving(true);
        setActionError('');

        try {
            const clinicalNarrative: ClinicalNarrative = {};
            if (subjective.trim()) clinicalNarrative.subjectiveReport = subjective.trim();
            if (objective.trim()) clinicalNarrative.objectiveObservation = objective.trim();
            if (assessment.trim()) clinicalNarrative.assessment = assessment.trim();
            if (plan.trim()) clinicalNarrative.plan = plan.trim();
            if (additionalNotes.trim()) clinicalNarrative.additionalNotes = additionalNotes.trim();

            const dto: UpdateSessionDto = { clinicalNarrative };
            await sessionsApi.updateSession(id, dto);
            setIsEditing(false);
            reload();
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isConflict) {
                    setActionError('No se puede editar: la sesión ya cambió de estado. Recargando...');
                    setTimeout(() => reload(), 2000);
                } else if (err.isLocked) {
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

    // End session — set endedAt so backend calculates durationMinutes
    async function handleEndSession() {
        if (!id) return;

        const confirmed = window.confirm(
            '¿Deseas finalizar esta sesión?\n\n' +
            'Se registrará la hora actual como fin de sesión y se calculará la duración.'
        );
        if (!confirmed) return;

        setIsEnding(true);
        setActionError('');

        try {
            const dto: UpdateSessionDto = {
                endedAt: new Date().toISOString(),
            };
            await sessionsApi.updateSession(id, dto);
            reload();
        } catch (err) {
            if (err instanceof ApiClientError) {
                setActionError(err.message);
            } else {
                setActionError('Error al finalizar sesión');
            }
        } finally {
            setIsEnding(false);
        }
    }

    // Sign session
    async function handleSign() {
        if (!id || !canSign) return;

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
                    setActionError('No se puede firmar: ' + err.message);
                } else if (err.isLocked) {
                    setActionError('Esta sesión está bloqueada por retención legal.');
                } else if (err.isForbidden) {
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

    // =========================================================================
    // LOADING / ERROR / NO DATA STATES
    // =========================================================================
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

    // =========================================================================
    // RENDER
    // =========================================================================
    const statusInfo = getLegalStatusInfo(legalStatus);
    const displayDuration = session.endedAt
        ? (session.durationMinutes ?? 0)
        : liveDuration;

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
                        {isActive && <Badge variant="pending">🟢 En curso</Badge>}
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
                            <span className={styles.infoLabel}>Inicio</span>
                            <span className={styles.infoValue}>
                                {new Date(session.startedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Duración</span>
                            <span className={styles.infoValue}>
                                {displayDuration} min {isActive && '⏱️'}
                            </span>
                        </div>
                        {session.endedAt && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Fin</span>
                                <span className={styles.infoValue}>
                                    {new Date(session.endedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
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

                {/* Clinical Narrative — SOAP format */}
                <Card className={styles.narrativeCard}>
                    <div className={styles.narrativeHeader}>
                        <h3>Narrativa Clínica (SOAP)</h3>
                        {!backendAllowsEdit && (
                            <span className={styles.readOnlyLabel}>Solo lectura</span>
                        )}
                    </div>

                    {!canViewNarrative ? (
                        <p className={styles.noAccess}>No tienes acceso a ver la narrativa clínica.</p>
                    ) : isEditing ? (
                        <div className={styles.editForm}>
                            <div className={styles.soapField}>
                                <label className={styles.soapLabel}>S — Subjetivo (lo que reporta el paciente)</label>
                                <textarea
                                    value={subjective}
                                    onChange={(e) => setSubjective(e.target.value)}
                                    className={styles.narrativeInput}
                                    rows={4}
                                    disabled={isSaving}
                                    placeholder="¿Qué reporta el paciente? Estado emocional, quejas, avances percibidos..."
                                />
                            </div>
                            <div className={styles.soapField}>
                                <label className={styles.soapLabel}>O — Observaciones del terapeuta</label>
                                <textarea
                                    value={objective}
                                    onChange={(e) => setObjective(e.target.value)}
                                    className={styles.narrativeInput}
                                    rows={4}
                                    disabled={isSaving}
                                    placeholder="Observaciones clínicas: conducta, afecto, lenguaje corporal..."
                                />
                            </div>
                            <div className={styles.soapField}>
                                <label className={styles.soapLabel}>A — Evaluación clínica</label>
                                <textarea
                                    value={assessment}
                                    onChange={(e) => setAssessment(e.target.value)}
                                    className={styles.narrativeInput}
                                    rows={4}
                                    disabled={isSaving}
                                    placeholder="Análisis, diagnóstico diferencial, progreso respecto a objetivos..."
                                />
                            </div>
                            <div className={styles.soapField}>
                                <label className={styles.soapLabel}>P — Plan de tratamiento</label>
                                <textarea
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    className={styles.narrativeInput}
                                    rows={4}
                                    disabled={isSaving}
                                    placeholder="Próximos pasos, técnicas a aplicar, tareas para el paciente..."
                                />
                            </div>
                            <div className={styles.soapField}>
                                <label className={styles.soapLabel}>Notas adicionales</label>
                                <textarea
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    className={styles.narrativeInput}
                                    rows={3}
                                    disabled={isSaving}
                                    placeholder="Información complementaria, coordinación interdisciplinaria..."
                                />
                            </div>
                            <div className={styles.editActions}>
                                <Button onClick={handleSave} isLoading={isSaving}>
                                    Guardar Narrativa
                                </Button>
                                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.narrativeContent}>
                                {session.clinicalNarrative && hasAnyContent(session.clinicalNarrative) ? (
                                    <div className={styles.soapDisplay}>
                                        {session.clinicalNarrative.subjectiveReport && (
                                            <div className={styles.soapSection}>
                                                <span className={styles.soapTag}>S — Subjetivo</span>
                                                <p>{session.clinicalNarrative.subjectiveReport}</p>
                                            </div>
                                        )}
                                        {session.clinicalNarrative.objectiveObservation && (
                                            <div className={styles.soapSection}>
                                                <span className={styles.soapTag}>O — Objetivo</span>
                                                <p>{session.clinicalNarrative.objectiveObservation}</p>
                                            </div>
                                        )}
                                        {session.clinicalNarrative.assessment && (
                                            <div className={styles.soapSection}>
                                                <span className={styles.soapTag}>A — Evaluación</span>
                                                <p>{session.clinicalNarrative.assessment}</p>
                                            </div>
                                        )}
                                        {session.clinicalNarrative.plan && (
                                            <div className={styles.soapSection}>
                                                <span className={styles.soapTag}>P — Plan</span>
                                                <p>{session.clinicalNarrative.plan}</p>
                                            </div>
                                        )}
                                        {session.clinicalNarrative.additionalNotes && (
                                            <div className={styles.soapSection}>
                                                <span className={styles.soapTag}>Notas</span>
                                                <p>{session.clinicalNarrative.additionalNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className={styles.emptyNarrative}>No hay narrativa registrada.</p>
                                )}
                            </div>
                            {canEdit && !isLocked && (
                                <Button onClick={handleEdit} variant="secondary" size="sm">
                                    {session.clinicalNarrative && hasAnyContent(session.clinicalNarrative)
                                        ? 'Editar Narrativa' : 'Escribir Narrativa'}
                                </Button>
                            )}
                        </>
                    )}
                </Card>

                {/* Actions */}
                <Card className={styles.actionsCard}>
                    <h3>Acciones</h3>

                    {/* Active session — can end it */}
                    {isActive && canEdit && (
                        <div className={styles.actionRow}>
                            <Button
                                onClick={handleEndSession}
                                isLoading={isEnding}
                                variant="secondary"
                            >
                                ⏹️ Finalizar Sesión
                            </Button>
                            <p className={styles.actionHint}>
                                Registra la hora de finalización y calcula la duración.
                            </p>
                        </div>
                    )}

                    {/* Sign Button — PENDING_REVIEW and not locked */}
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

                    {/* Info messages */}
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

                    {/* DRAFT with ended session — hint to edit and sign */}
                    {legalStatus === SessionLegalStatus.DRAFT && session.endedAt && !isLocked && (
                        <p className={styles.actionHint}>
                            La sesión ha finalizado. Edita la narrativa y luego podrás enviarla para revisión y firma.
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

function hasAnyContent(n: ClinicalNarrative): boolean {
    return !!(n.subjectiveReport || n.objectiveObservation || n.assessment || n.plan || n.additionalNotes);
}
