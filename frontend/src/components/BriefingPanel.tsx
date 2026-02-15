// =============================================================================
// BRIEFING PANEL
// 5-minute pre-session briefing slideout
// Shows: last session plan, last shadow note, pending topics
// =============================================================================

import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import styles from './BriefingPanel.module.css';

interface BriefingData {
    patientId: string;
    patientName: string;
    lastSessionPlan: string | null;
    lastSessionDate: string | null;
    lastShadowNote: string | null;
    lastShadowNoteDate: string | null;
    pendingTopics: string[];
}

interface BriefingPanelProps {
    patientId: string;
}

export default function BriefingPanel({ patientId }: BriefingPanelProps) {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<BriefingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || data) return;

        async function loadBriefing() {
            setLoading(true);
            setError(null);
            try {
                const result = await apiClient<BriefingData>(
                    `/patients/${patientId}/briefing`
                );
                setData(result);
            } catch {
                setError('No se pudo cargar el briefing');
            } finally {
                setLoading(false);
            }
        }
        loadBriefing();
    }, [open, patientId, data]);

    return (
        <>
            {/* Toggle button */}
            <button
                className={`${styles.toggleBtn} ${open ? styles.toggleOpen : ''}`}
                onClick={() => setOpen(!open)}
                title="Briefing de 5 minutos"
            >
                ⚡ Briefing
            </button>

            {/* Slideout panel */}
            <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
                <div className={styles.panelHeader}>
                    <h3 className={styles.panelTitle}>⚡ Briefing de 5 min</h3>
                    <button className={styles.closeBtn} onClick={() => setOpen(false)}>✕</button>
                </div>

                <div className={styles.panelBody}>
                    {loading && (
                        <div className={styles.loading}>Cargando briefing...</div>
                    )}

                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}

                    {data && !loading && (
                        <>
                            {/* LAST SESSION PLAN */}
                            <section className={styles.section}>
                                <h4 className={styles.sectionTitle}>📋 Plan anterior</h4>
                                {data.lastSessionPlan ? (
                                    <>
                                        <p className={styles.sectionDate}>
                                            {data.lastSessionDate && new Date(data.lastSessionDate).toLocaleDateString('es-MX', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </p>
                                        <p className={styles.sectionText}>{data.lastSessionPlan}</p>
                                    </>
                                ) : (
                                    <p className={styles.empty}>Sin plan previo</p>
                                )}
                            </section>

                            {/* LAST SHADOW NOTE */}
                            <section className={styles.section}>
                                <h4 className={styles.sectionTitle}>🔒 Nota sombra</h4>
                                {data.lastShadowNote ? (
                                    <>
                                        <p className={styles.sectionDate}>
                                            {data.lastShadowNoteDate && new Date(data.lastShadowNoteDate).toLocaleDateString('es-MX', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </p>
                                        <p className={styles.sectionText}>{data.lastShadowNote}</p>
                                    </>
                                ) : (
                                    <p className={styles.empty}>Sin nota sombra</p>
                                )}
                            </section>

                            {/* PENDING TOPICS */}
                            <section className={styles.section}>
                                <h4 className={styles.sectionTitle}>📌 Temas pendientes</h4>
                                {data.pendingTopics.length > 0 ? (
                                    <ul className={styles.topicList}>
                                        {data.pendingTopics.map((topic, i) => (
                                            <li key={i} className={styles.topicItem}>{topic}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className={styles.empty}>Sin temas pendientes</p>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </div>

            {/* Backdrop */}
            {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}
        </>
    );
}
