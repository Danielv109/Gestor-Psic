// =============================================================================
// LOGIN PAGE
// Handles post-login redirect to original destination
// =============================================================================

import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ApiClientError } from '../api/client';
import styles from './Login.module.css';

interface LocationState {
    from?: { pathname: string };
}

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, status, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect destination from location state
    const state = location.state as LocationState;
    const from = state?.from?.pathname || '/';

    // If already authenticated, redirect immediately
    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            // After successful login, navigate to original destination
            navigate(from, { replace: true });
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.isRateLimited) {
                    setError('Demasiados intentos. Espera un momento.');
                } else if (err.statusCode === 401) {
                    setError('Credenciales inválidas.');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Error de conexión. Intenta de nuevo.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // Show loading while auth status is being determined
    if (status === 'loading') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <p style={{ textAlign: 'center' }}>Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Clinical OS</h1>
                    <p className={styles.subtitle}>Iniciar Sesión</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* Show message if redirected from protected route */}
                    {from !== '/' && !error && (
                        <div className={styles.info}>
                            Inicia sesión para continuar
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="correo@ejemplo.com"
                            required
                            autoComplete="email"
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Sistema de Gestión Clínica Psicológica
                </p>
            </div>
        </div>
    );
}
