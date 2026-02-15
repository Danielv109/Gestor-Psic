import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BootstrapUserDto, BootstrapResult } from './interfaces/bootstrap.interfaces';
export declare class SystemBootstrapService {
    private readonly prisma;
    private readonly configService;
    private readonly auditService;
    constructor(prisma: PrismaService, configService: ConfigService, auditService: AuditService);
    isBootstrapEnabled(): boolean;
    validateSetupToken(providedToken: string): boolean;
    isBootstrapCompleted(): Promise<boolean>;
    executeBootstrap(dto: BootstrapUserDto, ip: string, userAgent: string): Promise<BootstrapResult>;
}
