// =============================================================================
// LAYOUT COMPONENT
// Navigation header for authenticated pages
// =============================================================================

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import SearchBar from './SearchBar';
import styles from './Layout.module.css';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    function isActive(path: string) {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    }

    return (
        <div className={styles.layout}>
            <nav className={styles.nav}>
                <div className={styles.navContent}>
                    <Link to="/" className={styles.brand}>
                        Clinical OS
                    </Link>

                    <div className={styles.links}>
                        <Link
                            to="/patients"
                            className={`${styles.link} ${isActive('/patients') ? styles.active : ''}`}
                        >
                            Pacientes
                        </Link>
                        <Link
                            to="/appointments"
                            className={`${styles.link} ${isActive('/appointments') ? styles.active : ''}`}
                        >
                            Citas
                        </Link>
                        <Link
                            to="/sessions"
                            className={`${styles.link} ${isActive('/sessions') ? styles.active : ''}`}
                        >
                            Sesiones
                        </Link>
                    </div>

                    <SearchBar />

                    <div className={styles.user}>
                        <span className={styles.userName}>
                            {user?.firstName} {user?.lastName}
                        </span>
                        <span className={styles.userRole}>
                            {user?.globalRole}
                        </span>
                        <button onClick={handleLogout} className={styles.logoutBtn}>
                            Salir
                        </button>
                    </div>
                </div>
            </nav>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
