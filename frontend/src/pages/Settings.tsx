// =============================================================================
// SETTINGS PAGE
// User profile and application settings
// =============================================================================

import { useAuth } from '../auth';
import { Card } from '../components';
import styles from './PatientDetail.module.css';

export default function Settings() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="page animate-fade-in">
            <div className="container">
                <header style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h1 className="page-title">Configuración</h1>
                    <p className="page-subtitle">Perfil y preferencias de la aplicación</p>
                </header>

                {/* Profile Info */}
                <Card className={styles.infoCard}>
                    <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: '1.125rem' }}>
                        Perfil de Usuario
                    </h2>
                    <div className={styles.infoGrid}>
                        <InfoItem label="Nombre" value={`${user.firstName} ${user.lastName}`} />
                        <InfoItem label="Email" value={user.email} />
                        <InfoItem label="Rol" value={formatRole(user.globalRole)} />
                        {user.licenseNumber && (
                            <InfoItem label="No. Licencia" value={user.licenseNumber} />
                        )}
                    </div>
                </Card>

                {/* Application Info */}
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    <Card className={styles.infoCard}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)', fontSize: '1.125rem' }}>
                            Aplicación
                        </h2>
                        <div className={styles.infoGrid}>
                            <InfoItem label="Versión" value="1.0.0" />
                            <InfoItem label="Entorno" value="Desarrollo" />
                        </div>
                    </Card>
                </div>

                {/* Logout */}
                <div style={{ marginTop: 'var(--spacing-xl)' }}>
                    <button
                        onClick={logout}
                        className="btn btn-secondary"
                        style={{
                            background: 'var(--color-danger, #dc3545)',
                            color: 'white',
                            border: 'none',
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 500,
                        }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// HELPERS
// =============================================================================

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className={styles.infoItem}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    );
}

function formatRole(role: string): string {
    const roles: Record<string, string> = {
        TERAPEUTA: 'Terapeuta',
        SUPERVISOR: 'Supervisor',
        ASISTENTE: 'Asistente',
        AUDITOR: 'Auditor',
    };
    return roles[role] ?? role;
}
