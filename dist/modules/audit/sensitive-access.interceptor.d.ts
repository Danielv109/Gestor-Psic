import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditResource } from '@prisma/client';
export declare const AUDIT_SENSITIVE_ACCESS_KEY = "audit:sensitiveAccess";
export interface SensitiveAccessConfig {
    resource: AuditResource;
    resourceIdParam: string;
    accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT';
    includePatientId?: boolean;
    patientIdParam?: string;
}
export declare const AuditSensitiveAccess: (config: SensitiveAccessConfig) => import("@nestjs/common").CustomDecorator<string>;
export declare class SensitiveAccessInterceptor implements NestInterceptor {
    private readonly reflector;
    private readonly auditService;
    constructor(reflector: Reflector, auditService: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
