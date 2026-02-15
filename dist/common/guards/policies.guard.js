"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PoliciesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliciesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const core_2 = require("@nestjs/core");
const policies_decorator_1 = require("../decorators/policies.decorator");
const audit_service_1 = require("../../modules/audit/audit.service");
const client_1 = require("@prisma/client");
let PoliciesGuard = PoliciesGuard_1 = class PoliciesGuard {
    constructor(reflector, moduleRef, auditService) {
        this.reflector = reflector;
        this.moduleRef = moduleRef;
        this.auditService = auditService;
        this.logger = new common_1.Logger(PoliciesGuard_1.name);
    }
    async canActivate(context) {
        const policyHandlers = this.reflector.getAllAndOverride(policies_decorator_1.CHECK_POLICIES_KEY, [context.getHandler(), context.getClass()]);
        if (!policyHandlers || policyHandlers.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const policyContext = this.buildPolicyContext(request);
        for (const handlerType of policyHandlers) {
            const handler = await this.getHandler(handlerType);
            try {
                const result = await handler.handle(user, request, policyContext);
                if (!result) {
                    await this.logAccessDenied(user, policyContext, handlerType.name);
                    throw new common_1.ForbiddenException('Access denied by policy');
                }
            }
            catch (error) {
                if (error instanceof common_1.ForbiddenException) {
                    throw error;
                }
                this.logger.error(`Policy ${handlerType.name} error: ${error.message}`);
                await this.logPolicyError(user, policyContext, handlerType.name, error);
                throw new common_1.ForbiddenException('Policy evaluation error');
            }
        }
        if (policyContext.auditOnSuccess) {
            await this.logAccessGranted(user, policyContext);
        }
        return true;
    }
    buildPolicyContext(request) {
        const method = request.method;
        let action = 'read';
        if (method === 'POST' && request.path?.includes('export')) {
            action = 'export';
        }
        else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            action = 'write';
        }
        else if (method === 'DELETE') {
            action = 'delete';
        }
        const pathParts = request.path?.split('/').filter(Boolean) || [];
        const resource = pathParts[0] || 'unknown';
        const resourceId = request.params?.id;
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
    async getHandler(handlerType) {
        try {
            return await this.moduleRef.resolve(handlerType);
        }
        catch {
            return this.moduleRef.get(handlerType, { strict: false });
        }
    }
    async logAccessDenied(user, context, policyName) {
        await this.auditService.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.ACCESS_DENIED,
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
        this.logger.warn(`Access denied for ${user.email} on ${context.resource}/${context.resourceId} by ${policyName}`);
    }
    async logAccessGranted(user, context) {
        const action = context.action === 'export'
            ? client_1.AuditAction.EXPORT
            : context.action === 'read'
                ? client_1.AuditAction.READ
                : client_1.AuditAction.UPDATE;
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
    async logPolicyError(user, context, policyName, error) {
        await this.auditService.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.ACCESS_DENIED,
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
    mapResource(resource) {
        const mapping = {
            sessions: client_1.AuditResource.CLINICAL_SESSION,
            patients: client_1.AuditResource.PATIENT,
            'shadow-notes': client_1.AuditResource.SHADOW_NOTE,
            appointments: client_1.AuditResource.APPOINTMENT,
            export: client_1.AuditResource.CLINICAL_SESSION,
            users: client_1.AuditResource.USER,
        };
        return mapping[resource] || client_1.AuditResource.CLINICAL_SESSION;
    }
};
exports.PoliciesGuard = PoliciesGuard;
exports.PoliciesGuard = PoliciesGuard = PoliciesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        core_2.ModuleRef,
        audit_service_1.AuditService])
], PoliciesGuard);
//# sourceMappingURL=policies.guard.js.map