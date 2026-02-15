import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { AuditService } from '../../modules/audit/audit.service';
export declare class PoliciesGuard implements CanActivate {
    private readonly reflector;
    private readonly moduleRef;
    private readonly auditService;
    private readonly logger;
    constructor(reflector: Reflector, moduleRef: ModuleRef, auditService: AuditService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private buildPolicyContext;
    private getHandler;
    private logAccessDenied;
    private logAccessGranted;
    private logPolicyError;
    private mapResource;
}
