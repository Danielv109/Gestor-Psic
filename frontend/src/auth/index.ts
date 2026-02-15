// =============================================================================
// AUTH INDEX
// =============================================================================

export {
    AuthProvider,
    useAuth,
    canCreatePatient,
    canDeletePatient,
    canCreateSession,
    canSignSession,
    canViewNarrative,
    canExport,
    canManageAppointments,
} from './AuthContext';

export { ProtectedRoute } from './ProtectedRoute';
