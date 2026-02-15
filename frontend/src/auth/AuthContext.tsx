// =============================================================================
// AUTH CONTEXT
// Memory-only token management, proper loading states
// =============================================================================

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode
} from 'react';
import type { User } from '../types';
import { GlobalRole } from '../types';
import { post, setAccessToken, clearAccessToken } from '../api/client';

// =============================================================================
// TYPES
// =============================================================================

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
    status: AuthStatus;
    user: User | null;
}

interface AuthContextType {
    // State
    status: AuthStatus;
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
    children: ReactNode;
}

interface LoginResponse {
    accessToken: string;
    user: User;
}

interface RefreshResponse {
    accessToken: string;
    user?: User; // Backend may or may not return user on refresh
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({
        status: 'loading',
        user: null,
    });

    // =============================================================================
    // INITIAL SESSION CHECK
    // Try to refresh on mount - NO assumption of valid token
    // =============================================================================
    useEffect(() => {
        let isMounted = true;

        async function checkSession() {
            try {
                const response = await post<RefreshResponse>('/auth/refresh', undefined, {
                    skipAuth: true,
                });

                if (isMounted && response.accessToken) {
                    setAccessToken(response.accessToken);

                    if (response.user) {
                        setState({ status: 'authenticated', user: response.user });
                    } else {
                        setState({ status: 'unauthenticated', user: null });
                    }
                }
            } catch {
                if (isMounted) {
                    setState({ status: 'unauthenticated', user: null });
                }
            }
        }

        checkSession();

        return () => {
            isMounted = false;
        };
    }, []);

    // =============================================================================
    // SILENT AUTO-REFRESH
    // Keeps the session alive without user interaction:
    // - Every 50 min (access token lasts 1h)
    // - When user returns to the tab after being away
    // =============================================================================
    useEffect(() => {
        if (state.status !== 'authenticated') return;

        let lastRefreshAt = Date.now();

        async function silentRefresh() {
            try {
                const response = await post<RefreshResponse>('/auth/refresh', undefined, {
                    skipAuth: true,
                });
                if (response.accessToken) {
                    setAccessToken(response.accessToken);
                    if (response.user) {
                        setState(prev => ({ ...prev, user: response.user! }));
                    }
                    lastRefreshAt = Date.now();
                }
            } catch {
                // Silent fail — do NOT log out here.
                // The API client's 401 handler will redirect to login
                // if the token is truly expired on the next real request.
                console.debug('[Auth] Silent refresh failed, will retry later');
            }
        }

        // Refresh every 50 minutes (access token = 1h)
        const interval = setInterval(silentRefresh, 50 * 60 * 1000);

        // Refresh when user returns to the tab (with 5s cooldown)
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                const elapsed = Date.now() - lastRefreshAt;
                // Only refresh if it's been at least 5 minutes since last refresh
                if (elapsed > 5 * 60 * 1000) {
                    silentRefresh();
                }
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [state.status]);

    // =============================================================================
    // LOGIN
    // =============================================================================
    const login = useCallback(async (email: string, password: string) => {
        // Set loading while attempting login
        setState(prev => ({ ...prev, status: 'loading' }));

        try {
            const response = await post<LoginResponse>('/auth/login', { email, password }, {
                skipAuth: true,
            });

            // Store token in memory ONLY
            setAccessToken(response.accessToken);

            setState({
                status: 'authenticated',
                user: response.user,
            });
        } catch (error) {
            // Reset to unauthenticated on failure
            setState({ status: 'unauthenticated', user: null });
            throw error; // Re-throw for UI to handle
        }
    }, []);

    // =============================================================================
    // LOGOUT
    // =============================================================================
    const logout = useCallback(async () => {
        try {
            // Call backend to invalidate refresh token
            await post('/auth/logout');
        } catch {
            // Ignore logout errors - still clear local state
        } finally {
            clearAccessToken();
            setState({ status: 'unauthenticated', user: null });
        }
    }, []);

    // =============================================================================
    // LOGOUT ALL (all devices)
    // =============================================================================
    const logoutAll = useCallback(async () => {
        try {
            await post<{ revokedTokens: number }>('/auth/logout-all');
        } catch {
            // Ignore errors
        } finally {
            clearAccessToken();
            setState({ status: 'unauthenticated', user: null });
        }
    }, []);

    // =============================================================================
    // CONTEXT VALUE (memoized)
    // =============================================================================
    const value = useMemo<AuthContextType>(() => ({
        status: state.status,
        user: state.user,
        isLoading: state.status === 'loading',
        isAuthenticated: state.status === 'authenticated',
        login,
        logout,
        logoutAll,
    }), [state.status, state.user, login, logout, logoutAll]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// =============================================================================
// HOOK
// =============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// =============================================================================
// ROLE HELPERS (pure functions, no context dependency)
// =============================================================================

export function canCreatePatient(role: GlobalRole): boolean {
    return role === GlobalRole.TERAPEUTA || role === GlobalRole.SUPERVISOR;
}

export function canDeletePatient(role: GlobalRole): boolean {
    return role === GlobalRole.SUPERVISOR;
}

export function canCreateSession(role: GlobalRole): boolean {
    return role === GlobalRole.TERAPEUTA;
}

export function canSignSession(role: GlobalRole): boolean {
    return role === GlobalRole.TERAPEUTA;
}

export function canViewNarrative(role: GlobalRole): boolean {
    return [GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.AUDITOR].includes(role);
}

export function canExport(role: GlobalRole): boolean {
    return role === GlobalRole.SUPERVISOR || role === GlobalRole.AUDITOR;
}

export function canManageAppointments(role: GlobalRole): boolean {
    return [GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE].includes(role);
}
