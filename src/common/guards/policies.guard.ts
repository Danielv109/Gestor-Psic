// src/common/guards/policies.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { CHECK_POLICIES_KEY } from '../decorators/policies.decorator';
import { PolicyHandler } from '../interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PolicyContext } from '../interfaces/policy-context.interface';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditAction, AuditResource } from '@prisma/client';

/**
 * PoliciesGuard
 * 
 * Ejecuta las políticas ABAC definidas con @CheckPolicies
 * Registra auditoría de decisiones de acceso
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
    private readonly logger = new Logger(PoliciesGuard.name);

    constructor(
        private readonly reflector: Reflector,
        private readonly moduleRef: ModuleRef,
        private readonly auditService: AuditService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policyHandlers = this.reflector.getAllAndOverride<any[]>(
            CHECK_POLICIES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Si no hay políticas definidas, permitir acceso
        if (!policyHandlers || policyHandlers.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user) {
            throw new ForbiddenException('Authentication required');
        }

        // Construir contexto de política
        const policyContext = this.buildPolicyContext(request);

        // Ejecutar cada política
        for (const handlerType of policyHandlers) {
            const handler = await this.getHandler(handlerType);

            try {
                const result = await handler.handle(user, request, policyContext);

                if (!result) {
                    // Política denegó acceso
                    await this.logAccessDenied(user, policyContext, handlerType.name);
                    throw new ForbiddenException('Access denied by policy');
                }
            } catch (error) {
                if (error instanceof ForbiddenException) {
                    throw error;
                }

                this.logger.error(`Policy ${handlerType.name} error: ${error.message}`);
                await this.logPolicyError(user, policyContext, handlerType.name, error);
                throw new ForbiddenException('Policy evaluation error');
            }
        }

        // Todas las políticas aprobaron
        if (policyContext.auditOnSuccess) {
            await this.logAccessGranted(user, policyContext);
        }

        return true;
    }

    private buildPolicyContext(request: any): PolicyContext {
        const method = request.method;

        let action: PolicyContext['action'] = 'read';
        if (method === 'POST' && request.path?.includes('export')) {
            action = 'export';
        } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            action = 'write';
        } else if (method === 'DELETE') {
            action = 'delete';
        }

        // Determinar recurso desde la ruta
        const pathParts = request.path?.split('/').filter(Boolean) || [];
        const resource = pathParts[0] || 'unknown';
        const resourceId = request.params?.id;

        // Verificar si debemos auditar lecturas sensibles
        const sensitiveResources = ['sessions', 'patients', 'shadow-notes', 'export'];
        const auditOnSuccess = sensitiveResources.includes(resource) || action === 'export';

        return {
            action,
            resource,
            resourceId,
            auditOnSuccess,
            metadata: {
                method,
                path: request.path,
                query: request.query,
            },
        };
    }

    private async getHandler(handlerType: any): Promise<PolicyHandler> {
        try {
            return await this.moduleRef.resolve(handlerType);
        } catch {
            // Fallback: intentar obtener como servicio
            return this.moduleRef.get(handlerType, { strict: false });
        }
    }

    private async logAccessDenied(
        user: AuthenticatedUser,
        context: PolicyContext,
        policyName: string,
    ): Promise<void> {
        await this.auditService.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.ACCESS_DENIED,
            resource: this.mapResource(context.resource),
            resourceId: context.resourceId || '00000000-0000-0000-0000-000000000000',
            success: false,
            failureReason: `Policy denied: ${policyName}`,
            details: {
                policy: policyName,
                action: context.action,
                ...context.metadata,
            },
        });

        this.logger.warn(
            `Access denied for ${user.email} on ${context.resource}/${context.resourceId} by ${policyName}`,
        );
    }

    private async logAccessGranted(
        user: AuthenticatedUser,
        context: PolicyContext,
    ): Promise<void> {
        const action = context.action === 'export'
            ? AuditAction.EXPORT
            : context.action === 'read'
                ? AuditAction.READ
                : AuditAction.UPDATE;

        await this.auditService.log({
            actorId: user.id,
            actorIp: user.ip,
            action,
            resource: this.mapResource(context.resource),
            resourceId: context.resourceId || '00000000-0000-0000-0000-000000000000',
            success: true,
            details: {
                action: context.action,
                ...context.metadata,
            },
        });
    }

    private async logPolicyError(
        user: AuthenticatedUser,
        context: PolicyContext,
        policyName: string,
        error: Error,
    ): Promise<void> {
        await this.auditService.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.ACCESS_DENIED,
            resource: this.mapResource(context.resource),
            resourceId: context.resourceId || '00000000-0000-0000-0000-000000000000',
            success: false,
            failureReason: `Policy error: ${policyName} - ${error.message}`,
            details: {
                policy: policyName,
                error: error.message,
            },
        });
    }

    private mapResource(resource: string): AuditResource {
        const mapping: Record<string, AuditResource> = {
            sessions: AuditResource.CLINICAL_SESSION,
            patients: AuditResource.PATIENT,
            'shadow-notes': AuditResource.SHADOW_NOTE,
            appointments: AuditResource.APPOINTMENT,
            export: AuditResource.CLINICAL_SESSION,
            users: AuditResource.USER,
        };

        return mapping[resource] || AuditResource.CLINICAL_SESSION;
    }
}
