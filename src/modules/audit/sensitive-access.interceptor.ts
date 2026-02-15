// src/modules/audit/sensitive-access.interceptor.ts
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditResource } from '@prisma/client';

/**
 * Metadata key para el decorador
 */
export const AUDIT_SENSITIVE_ACCESS_KEY = 'audit:sensitiveAccess';

/**
 * Configuración de auditoría sensible
 */
export interface SensitiveAccessConfig {
    resource: AuditResource;
    resourceIdParam: string; // Nombre del parámetro de ruta (e.g., 'id')
    accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT';
    includePatientId?: boolean;
    patientIdParam?: string;
}

/**
 * Decorador para marcar endpoints con acceso sensible
 * 
 * @example
 * @Get(':id')
 * @AuditSensitiveAccess({
 *   resource: AuditResource.CLINICAL_SESSION,
 *   resourceIdParam: 'id',
 *   accessType: 'VIEW',
 * })
 * async getSession(@Param('id') id: string) { ... }
 */
export const AuditSensitiveAccess = (config: SensitiveAccessConfig) =>
    SetMetadata(AUDIT_SENSITIVE_ACCESS_KEY, config);

/**
 * SensitiveAccessInterceptor
 * 
 * Intercepta requests a endpoints marcados con @AuditSensitiveAccess
 * y registra automáticamente el acceso en el audit log.
 */
@Injectable()
export class SensitiveAccessInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly auditService: AuditService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const config = this.reflector.get<SensitiveAccessConfig>(
            AUDIT_SENSITIVE_ACCESS_KEY,
            context.getHandler(),
        );

        // Si no está configurado, pasar sin auditar
        if (!config) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // Si no hay usuario autenticado, no auditar
        if (!user) {
            return next.handle();
        }

        const resourceId = request.params[config.resourceIdParam];
        const patientId = config.includePatientId && config.patientIdParam
            ? request.params[config.patientIdParam]
            : undefined;

        return next.handle().pipe(
            tap({
                next: () => {
                    // Auditar acceso exitoso
                    this.auditService.logSensitiveAccess({
                        actorId: user.id,
                        actorRole: user.globalRole,
                        actorIp: user.ip || request.ip,
                        resource: config.resource,
                        resourceId,
                        patientId,
                        accessType: config.accessType,
                    }).catch((err) => {
                        // No fallar el request si falla la auditoría
                        console.error('Failed to log sensitive access:', err);
                    });
                },
                error: () => {
                    // No auditar accesos fallidos aquí (lo hace el guard)
                },
            }),
        );
    }
}
