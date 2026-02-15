// =============================================================================
// DASHBOARD PAGE
// Shows today's agenda + quick-access cards
// =============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '../auth';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Appointment } from '../types';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadToday() {
            try {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
                const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
                const data = await apiClient<Appointment[]>(
                    `/appointments/range?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
                );
                // Sort by scheduled time
                data.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
                setTodayAppts(data);
            } catch {
                // silently fail — dashboard still usable
            } finally {
                setLoading(false);
            }
        }
        loadToday();
    }, []);

    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div className="page animate-fade-in">
            <div className="container">
                <header className="page-header">
                    <h1 className="page-title">
                        {greeting}, {user?.firstName}
                    </h1>
                    <p className="page-subtitle">
                        {now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </header>

                {/* ============ TODAY'S AGENDA ============ */}
                <section className={styles.agendaSection}>
                    <h2 className={styles.sectionTitle}>📋 Agenda de hoy</h2>

                    {loading ? (
                        <div className={styles.agendaLoading}>Cargando citas...</div>
                    ) : todayAppts.length === 0 ? (
                        <div className={styles.agendaEmpty}>
                            <span className={styles.emptyIcon}>☕</span>
                            <p>Sin citas programadas hoy</p>
                        </div>
                    ) : (
                        <div className={styles.timeline}>
                            {todayAppts.map((appt, i) => {
                                const time = new Date(appt.scheduledStart);
                                const isPast = time < now;
                                const isNext = !isPast && (i === 0 || new Date(todayAppts[i - 1].scheduledStart) < now);

                                return (
                                    <Link
                                        key={appt.id}
                                        to={`/appointments/${appt.id}`}
                                        className={`${styles.timelineItem} ${isPast ? styles.past : ''} ${isNext ? styles.next : ''}`}
                                    >
                                        <div className={styles.timelineDot} />
                                        <div className={styles.timelineTime}>
                                            {time.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <span className={styles.patientName}>
                                                {appt.patient?.firstName} {appt.patient?.lastName}
                                            </span>
                                            <span className={`${styles.apptStatus} ${styles[`status_${appt.status.toLowerCase()}`]}`}>
                                                {appt.status === 'CONFIRMED' ? '✓ Confirmada' :
                                                    appt.status === 'SCHEDULED' ? '⏳ Pendiente' :
                                                        appt.status === 'CANCELLED' ? '✗ Cancelada' :
                                                            appt.status === 'COMPLETED' ? '✓ Completada' : appt.status}
                                            </span>
                                        </div>
                                        {isNext && <span className={styles.nextBadge}>Siguiente</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ============ QUICK ACCESS CARDS ============ */}
                <div className={styles.grid}>
                    <Link to="/patients" className={styles.card}>
                        <div className={styles.cardIcon}>👥</div>
                        <h3 className={styles.cardTitle}>Pacientes</h3>
                        <p className={styles.cardDesc}>Gestionar pacientes</p>
                    </Link>

                    <Link to="/appointments" className={styles.card}>
                        <div className={styles.cardIcon}>📅</div>
                        <h3 className={styles.cardTitle}>Citas</h3>
                        <p className={styles.cardDesc}>Agenda y programación</p>
                    </Link>

                    <Link to="/sessions" className={styles.card}>
                        <div className={styles.cardIcon}>📝</div>
                        <h3 className={styles.cardTitle}>Sesiones</h3>
                        <p className={styles.cardDesc}>Notas clínicas</p>
                    </Link>

                    <Link to="/settings" className={styles.card}>
                        <div className={styles.cardIcon}>⚙️</div>
                        <h3 className={styles.cardTitle}>Configuración</h3>
                        <p className={styles.cardDesc}>Mi cuenta</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
