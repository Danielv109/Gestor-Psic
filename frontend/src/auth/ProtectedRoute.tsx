// =============================================================================
// PROTECTED ROUTE
// Waits for loading, redirects only if unauthenticated
// =============================================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Spinner } from '../components';
import type { GlobalRole } from '../types';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: GlobalRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { status, user } = useAuth();
    const location = useLocation();

    // =============================================================================
    // LOADING STATE - Wait for auth check to complete
    // =============================================================================
    if (status === 'loading') {
        return (
            <div className={styles.loading}>
                <Spinner size="lg" />
                <p>Verificando sesión...</p>
            </div>
        );
    }

    // =============================================================================
    // UNAUTHENTICATED - Redirect to login
    // =============================================================================
    if (status === 'unauthenticated') {
        // Save intended destination for redirect after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // =============================================================================
    // ROLE CHECK (if roles specified)
    // =============================================================================
    if (allowedRoles && user && !allowedRoles.includes(user.globalRole)) {
        return (
            <div className={styles.denied}>
                <h2>Acceso Denegado</h2>
                <p>No tienes permisos para acceder a esta página.</p>
                <p className={styles.role}>Tu rol: {user.globalRole}</p>
            </div>
        );
    }

    // =============================================================================
    // AUTHENTICATED - Render children
    // =============================================================================
    return <>{children}</>;
}
