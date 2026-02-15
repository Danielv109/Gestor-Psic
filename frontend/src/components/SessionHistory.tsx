// =============================================================================
// SESSION HISTORY
// Collapsible panel showing human-readable version history for a session
// =============================================================================

import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import styles from './SessionHistory.module.css';

interface SessionVersion {
    id: string;
    versionNumber: number;
    createdAt: string;
    changeReason: string | null;
    narrativeText: string | null;
}

interface SessionHistoryProps {
    sessionId: string;
}

export default function SessionHistory({ sessionId }: SessionHistoryProps) {
    const [versions, setVersions] = useState<SessionVersion[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    useEffect(() => {
        if (!expanded || versions.length > 0) return;

        async function loadVersions() {
            setLoading(true);
            try {
                const data = await apiClient<SessionVersion[]>(
                    `/sessions/${sessionId}/versions`
                );
                setVersions(data);
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        }
        loadVersions();
    }, [expanded, sessionId, versions.length]);

    if (!expanded) {
        return (
            <button
                className={styles.toggleBtn}
                onClick={() => setExpanded(true)}
            >
                📜 Ver historial de cambios
            </button>
        );
    }

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h3 className={styles.title}>📜 Historial de Cambios</h3>
                <button
                    className={styles.closeBtn}
                    onClick={() => { setExpanded(false); setSelectedIdx(null); }}
                >
                    ✕
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Cargando versiones...</div>
            ) : versions.length === 0 ? (
                <div className={styles.empty}>Sin versiones anteriores</div>
            ) : (
                <div className={styles.content}>
                    <div className={styles.versionList}>
                        {versions.map((v, i) => (
                            <button
                                key={v.id}
                                className={`${styles.versionItem} ${selectedIdx === i ? styles.selected : ''}`}
                                onClick={() => setSelectedIdx(i)}
                            >
                                <span className={styles.versionNum}>v{v.versionNumber}</span>
                                <span className={styles.versionDate}>
                                    {new Date(v.createdAt).toLocaleString('es-MX', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                                {v.changeReason && (
                                    <span className={styles.reason}>{v.changeReason}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {selectedIdx !== null && versions[selectedIdx] && (
                        <div className={styles.narrativeView}>
                            <h4 className={styles.narrativeTitle}>
                                Versión {versions[selectedIdx].versionNumber}
                                {versions[selectedIdx].changeReason && (
                                    <span className={styles.narrativeReason}>
                                        — {versions[selectedIdx].changeReason}
                                    </span>
                                )}
                            </h4>
                            <pre className={styles.narrativeText}>
                                {versions[selectedIdx].narrativeText || 'Sin contenido disponible'}
                            </pre>

                            {/* Simple diff: show previous vs selected */}
                            {selectedIdx < versions.length - 1 && (
                                <div className={styles.diffSection}>
                                    <h5 className={styles.diffTitle}>Comparación con versión anterior</h5>
                                    <div className={styles.diffGrid}>
                                        <div className={styles.diffOld}>
                                            <span className={styles.diffLabel}>v{versions[selectedIdx + 1].versionNumber} (anterior)</span>
                                            <pre>{versions[selectedIdx + 1].narrativeText || '—'}</pre>
                                        </div>
                                        <div className={styles.diffNew}>
                                            <span className={styles.diffLabel}>v{versions[selectedIdx].versionNumber} (actual)</span>
                                            <pre>{versions[selectedIdx].narrativeText || '—'}</pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
