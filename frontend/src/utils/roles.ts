// =============================================================================
// ROLE HELPERS
// UI-ONLY visibility and interaction rules
// 
// TODOS LOS PERMISOS PARA TODOS LOS ROLES
// Todas las funciones retornan true para que la UI no restrinja nada
// =============================================================================

import { GlobalRole } from '../types';

// =============================================================================
// ROLE TYPE GUARDS
// =============================================================================

export function isTerapeuta(role: GlobalRole): boolean {
    return role === GlobalRole.TERAPEUTA;
}

export function isSupervisor(role: GlobalRole): boolean {
    return role === GlobalRole.SUPERVISOR;
}

export function isAsistente(role: GlobalRole): boolean {
    return role === GlobalRole.ASISTENTE;
}

export function isAuditor(role: GlobalRole): boolean {
    return role === GlobalRole.AUDITOR;
}

// =============================================================================
// PATIENT PERMISSIONS - Todos tienen acceso
// =============================================================================

export function canShowCreatePatientButton(_role: GlobalRole): boolean {
    return true;
}

export function canShowDeletePatientButton(_role: GlobalRole): boolean {
    return true;
}

export function canEditPatientForm(_role: GlobalRole): boolean {
    return true;
}

// =============================================================================
// SESSION PERMISSIONS - Todos tienen acceso
// =============================================================================

export function canShowStartSessionButton(_role: GlobalRole): boolean {
    return true;
}

export function canEditSessionNarrative(_role: GlobalRole): boolean {
    return true;
}

export function canShowSignSessionButton(_role: GlobalRole): boolean {
    return true;
}

export function canViewSessionNarrative(_role: GlobalRole): boolean {
    return true;
}

export function canViewSessionVersions(_role: GlobalRole): boolean {
    return true;
}

// =============================================================================
// APPOINTMENT PERMISSIONS - Todos tienen acceso
// =============================================================================

export function canShowCreateAppointmentButton(_role: GlobalRole): boolean {
    return true;
}

export function canEditAppointment(_role: GlobalRole): boolean {
    return true;
}

export function canManageAppointmentStatus(_role: GlobalRole): boolean {
    return true;
}

// =============================================================================
// EXPORT/AUDIT PERMISSIONS - Todos tienen acceso
// =============================================================================

export function canShowExportButton(_role: GlobalRole): boolean {
    return true;
}

export function canViewAuditTrail(_role: GlobalRole): boolean {
    return true;
}

// =============================================================================
// HELPER COMPONENT PROPS
// =============================================================================

export interface RoleBasedProps {
    /** User's current role */
    role: GlobalRole;
    /** Fallback to show when user doesn't have permission */
    fallback?: React.ReactNode;
}

// =============================================================================
// UI STATE HELPERS
// =============================================================================

export function getReadOnlyLabel(canEdit: boolean): string | null {
    return canEdit ? null : 'Solo lectura';
}

export function getDisabledState(canEdit: boolean): boolean {
    return !canEdit;
}
