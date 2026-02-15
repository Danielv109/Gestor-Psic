export interface PolicyContext {
    action: 'read' | 'write' | 'delete' | 'export';
    resource: string;
    resourceId?: string;
    auditOnSuccess?: boolean;
    metadata?: Record<string, any>;
}
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
    auditDetails?: Record<string, any>;
}
