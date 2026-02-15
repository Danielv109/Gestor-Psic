// =============================================================================
// SESSIONS PAGE
// List with loading, empty, error states
// =============================================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../hooks';
import { Spinner, Card, Badge, Button, ErrorMessage } from '../components';
import { SessionLegalStatus, type ClinicalSession } from '../types';
import styles from './Sessions.module.css';

type FilterType = 'all' | 'draft' | 'pending' | 'signed';

export default function Sessions() {
    const { sessions, isLoading, error, reload } = useSessions();
    const [filter, setFilter] = useState<FilterType>('all');

    // Client-side filtering (backend filter may not exist)
    const filteredSessions = sessions.filter(session => {
        if (filter === 'all') return true;
        if (filter === 'draft') return session.legalStatus === SessionLegalStatus.DRAFT;
        if (filter === 'pending') return session.legalStatus === SessionLegalStatus.PENDING_REVIEW;
        if (filter === 'signed') return [
            SessionLegalStatus.SIGNED,
            SessionLegalStatus.AMENDED,
        ].includes(session.legalStatus);
        return true;
    });

    // =============================================================================
    // LOADING STATE
    // =============================================================================
    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <div className={styles.loadingContainer}>
                        <Spinner size="lg" />
                        <p>Cargando sesiones...</p>
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
                        <h1 className="page-title">Sesiones Clínicas</h1>
                        <p className="page-subtitle">
                            {sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} en total
                        </p>
                    </div>
                </header>

                {/* Filters */}
                <div className={styles.filters}>
                    <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                        Todas ({sessions.length})
                    </FilterButton>
                    <FilterButton active={filter === 'draft'} onClick={() => setFilter('draft')}>
                        Borrador ({sessions.filter(s => s.legalStatus === SessionLegalStatus.DRAFT).length})
                    </FilterButton>
                    <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
                        Revisión ({sessions.filter(s => s.legalStatus === SessionLegalStatus.PENDING_REVIEW).length})
                    </FilterButton>
                    <FilterButton active={filter === 'signed'} onClick={() => setFilter('signed')}>
                        Firmadas ({sessions.filter(s => [SessionLegalStatus.SIGNED, SessionLegalStatus.AMENDED].includes(s.legalStatus)).length})
                    </FilterButton>
                </div>

                {/* Empty State - No sessions at all */}
                {sessions.length === 0 ? (
                    <Card className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>No hay sesiones registradas</h3>
                        <p>Las sesiones se crean a partir de citas confirmadas.</p>
                        <Link to="/appointments" className="btn btn-primary">
                            Ver Citas
                        </Link>
                    </Card>
                ) : filteredSessions.length === 0 ? (
                    /* Empty filtered results */
                    <Card className={styles.emptyState}>
                        <p>No hay sesiones con el filtro seleccionado.</p>
                    </Card>
                ) : (
                    /* Sessions List */
                    <div className={styles.list}>
                        {filteredSessions.map(session => (
                            <SessionCard key={session.id} session={session} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// FILTER BUTTON COMPONENT
// =============================================================================
interface FilterButtonProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`${styles.filterBtn} ${active ? styles.filterBtnActive : ''}`}
        >
            {children}
        </button>
    );
}

// =============================================================================
// SESSION CARD COMPONENT
// =============================================================================
interface SessionCardProps {
    session: ClinicalSession;
}

function SessionCard({ session }: SessionCardProps) {
    return (
        <Link to={`/sessions/${session.id}`} className={styles.card}>
            <div className={styles.cardMain}>
                <div className={styles.cardDate}>
                    {new Date(session.sessionDate ?? session.startedAt).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>
                <div className={styles.cardMeta}>
                    {session.patient && (
                        <span className={styles.patientName}>
                            {session.patient.firstName} {session.patient.lastName}
                        </span>
                    )}
                    {session.sessionType && (
                        <span className={styles.sessionType}>{session.sessionType}</span>
                    )}
                </div>
            </div>
            <div className={styles.cardStatus}>
                <Badge variant={getLegalStatusVariant(session.legalStatus)}>
                    {getLegalStatusLabel(session.legalStatus)}
                </Badge>
                {session.isLocked && (
                    <Badge variant="voided">🔒 Bloqueada</Badge>
                )}
                <span className={styles.arrow}>→</span>
            </div>
        </Link>
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
