// src/common/interfaces/policy-context.interface.ts

/**
 * Contexto adicional para políticas ABAC
 * Permite decisiones más granulares y auditoría
 */
export interface PolicyContext {
    /** Tipo de acción */
    action: 'read' | 'write' | 'delete' | 'export';

    /** Recurso al que se accede */
    resource: string;

    /** ID del recurso (si aplica) */
    resourceId?: string;

    /** Si true, registra auditoría incluso en accesos exitosos */
    auditOnSuccess?: boolean;

    /** Metadatos adicionales para auditoría */
    metadata?: Record<string, any>;
}

/**
 * Resultado de evaluación de política
 */
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
    auditDetails?: Record<string, any>;
}
