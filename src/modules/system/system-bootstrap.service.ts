// src/modules/system/system-bootstrap.service.ts
import {
    Injectable,
    GoneException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GlobalRole, AuditAction, AuditResource } from '@prisma/client';
import * as crypto from 'crypto';
import {
    BootstrapUserDto,
    BootstrapResult,
    BOOTSTRAP_COMPLETED_KEY,
} from './interfaces/bootstrap.interfaces';

@Injectable()
export class SystemBootstrapService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Verifica si el endpoint de bootstrap está habilitado
     */
    isBootstrapEnabled(): boolean {
        const setupToken = this.configService.get<string>('SYSTEM_SETUP_TOKEN');
        return !!setupToken && setupToken.length > 0;
    }

    /**
     * Verifica si el token de setup es válido
     */
    validateSetupToken(providedToken: string): boolean {
        const setupToken = this.configService.get<string>('SYSTEM_SETUP_TOKEN');
        if (!setupToken) {
            return false;
        }
        return providedToken === setupToken;
    }

    /**
     * Verifica si el bootstrap ya fue completado
     */
    async isBootstrapCompleted(): Promise<boolean> {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key: BOOTSTRAP_COMPLETED_KEY },
        });
        return config?.value === 'true';
    }

    /**
     * Ejecuta el bootstrap del sistema
     * Crea el primer usuario con rol SUPERVISOR
     */
    async executeBootstrap(
        dto: BootstrapUserDto,
        ip: string,
        userAgent: string,
    ): Promise<BootstrapResult> {
        // 1. Verificar que bootstrap no haya sido completado
        const alreadyCompleted = await this.isBootstrapCompleted();
        if (alreadyCompleted) {
            throw new GoneException(
                'El bootstrap del sistema ya fue completado. Este endpoint está deshabilitado.',
            );
        }

        // 2. Verificar que no existan usuarios
        const existingUsers = await this.prisma.user.count();
        if (existingUsers > 0) {
            throw new ConflictException(
                'Ya existen usuarios en el sistema. Bootstrap no permitido.',
            );
        }

        // 3. Crear usuario inicial con rol SUPERVISOR
        const passwordHash = crypto
            .createHash('sha256')
            .update(dto.password)
            .digest('hex');
        const now = new Date();

        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                globalRole: GlobalRole.SUPERVISOR,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                licenseNumber: dto.licenseNumber?.trim() || null,
                isActive: true,
                passwordChangedAt: now,
            },
        });

        // 4. Marcar bootstrap como completado
        await this.prisma.systemConfig.create({
            data: {
                key: BOOTSTRAP_COMPLETED_KEY,
                value: 'true',
                metadata: {
                    completedAt: now.toISOString(),
                    completedByIp: ip,
                    completedByUserAgent: userAgent,
                    initialUserId: user.id,
                    initialUserEmail: user.email,
                },
            },
        });

        // 5. Registrar evento de auditoría
        await this.auditService.log({
            actorId: user.id,
            actorRole: GlobalRole.SUPERVISOR,
            actorIp: ip,
            action: AuditAction.CREATE,
            resource: AuditResource.USER,
            resourceId: user.id,
            success: true,
            details: {
                event: 'BOOTSTRAP_COMPLETED',
                userAgent,
                message: 'Sistema inicializado con primer usuario SUPERVISOR',
            },
        });

        return {
            success: true,
            message: 'Bootstrap completado exitosamente. Este endpoint ya no está disponible.',
            user: {
                id: user.id,
                email: user.email,
                globalRole: user.globalRole,
            },
            bootstrapCompletedAt: now,
        };
    }
}
