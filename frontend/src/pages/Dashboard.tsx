// =============================================================================
// DASHBOARD PAGE
// =============================================================================

import { useAuth } from '../auth';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="page animate-fade-in">
            <div className="container">
                <header className="page-header">
                    <h1 className="page-title">
                        Bienvenido, {user?.firstName}
                    </h1>
                    <p className="page-subtitle">
                        Panel de control • {user?.globalRole}
                    </p>
                </header>

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

                <section className={styles.infoSection}>
                    <h2>Sistema Activo</h2>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoPill}>
                            <span className={styles.infoLabel}>Estado:</span>
                            <span className={styles.infoValue}>En línea</span>
                        </div>
                        <div className={styles.infoPill}>
                            <span className={styles.infoLabel}>Rol:</span>
                            <span className={styles.infoValue}>{user?.globalRole}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
