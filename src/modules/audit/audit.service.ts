// src/modules/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditResource, GlobalRole } from '@prisma/client';

export interface AuditLogInput {
    actorId?: string;
    actorRole?: GlobalRole;
    actorIp: string;
    actorUserAgent?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    patientId?: string;
    details?: Record<string, any>;
    success?: boolean;
    failureReason?: string;
}

@Injectable()
export class AuditService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Registrar evento de auditoría.
     * Los logs son INMUTABLES - nunca se eliminan ni modifican.
     */
    async log(input: AuditLogInput): Promise<void> {
        // Sanitizar details para no incluir datos sensibles
        const sanitizedDetails = input.details
            ? this.sanitizeDetails(input.details)
            : undefined;

        await this.prisma.auditLog.create({
            data: {
                actorId: input.actorId,
                actorRole: input.actorRole,
                actorIp: input.actorIp,
                actorUserAgent: input.actorUserAgent,
                action: input.action,
                resource: input.resource,
                resourceId: input.resourceId,
                patientId: input.patientId,
                details: sanitizedDetails,
                success: input.success ?? true,
                failureReason: input.failureReason,
            },
        });
    }

    /**
     * Registrar intento fallido de acceso
     */
    async logAccessDenied(input: {
        actorId?: string;
        actorIp: string;
        resource: AuditResource;
        resourceId: string;
        reason: string;
    }): Promise<void> {
        await this.log({
            actorId: input.actorId,
            actorIp: input.actorIp,
            action: AuditAction.ACCESS_DENIED,
            resource: input.resource,
            resourceId: input.resourceId,
            success: false,
            failureReason: input.reason,
        });
    }

    /**
     * Buscar logs por paciente (para auditoría)
     */
    async findByPatient(patientId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        return this.prisma.auditLog.findMany({
            where: {
                patientId,
                timestamp: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
            orderBy: { timestamp: 'desc' },
            skip: options?.skip,
            take: options?.take,
        });
    }

    /**
     * Buscar logs por actor (para auditoría)
     */
    async findByActor(actorId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        return this.prisma.auditLog.findMany({
            where: {
                actorId,
                timestamp: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
            orderBy: { timestamp: 'desc' },
            skip: options?.skip,
            take: options?.take,
        });
    }

    /**
     * Sanitizar details para no incluir información sensible
     */
    private sanitizeDetails(details: Record<string, any>): Record<string, any> {
        const sensitiveKeys = [
            'password',
            'token',
            'secret',
            'key',
            'content',
            'narrative',
            'note',
        ];

        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(details)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = sensitiveKeys.some((k) => lowerKey.includes(k));

            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeDetails(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    // ============================================================
    // MÉTODOS EXTENDIDOS - Accesos Sensibles y Exportaciones
    // ============================================================

    /**
     * Registrar acceso a datos clínicos sensibles (GETs)
     */
    async logSensitiveAccess(input: {
        actorId: string;
        actorRole: GlobalRole;
        actorIp: string;
        resource: AuditResource;
        resourceId: string;
        patientId?: string;
        accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT';
        fields?: string[];
    }): Promise<void> {
        await this.log({
            actorId: input.actorId,
            actorRole: input.actorRole,
            actorIp: input.actorIp,
            action: AuditAction.READ,
            resource: input.resource,
            resourceId: input.resourceId,
            patientId: input.patientId,
            success: true,
            details: {
                sensitiveAccess: true,
                accessType: input.accessType,
                fieldsAccessed: input.fields,
            },
        });
    }

    /**
     * Registrar exportación con trazabilidad completa
     */
    async logExport(input: {
        actorId: string;
        actorRole: GlobalRole;
        actorIp: string;
        exportRecordId: string;
        resource: AuditResource;
        resourceId: string;
        patientId?: string;
        format: string;
        includesPII: boolean;
        maskedPII: boolean;
        recordCount: number;
    }): Promise<void> {
        await this.log({
            actorId: input.actorId,
            actorRole: input.actorRole,
            actorIp: input.actorIp,
            action: AuditAction.EXPORT,
            resource: input.resource,
            resourceId: input.resourceId,
            patientId: input.patientId,
            success: true,
            details: {
                exportRecordId: input.exportRecordId,
                format: input.format,
                includesPII: input.includesPII,
                maskedPII: input.maskedPII,
                recordCount: input.recordCount,
            },
        });
    }

    /**
     * Buscar logs por recurso específico
     */
    async findByResource(
        resource: AuditResource,
        resourceId: string,
        options?: {
            skip?: number;
            take?: number;
            startDate?: Date;
            endDate?: Date;
        },
    ) {
        return this.prisma.auditLog.findMany({
            where: {
                resource,
                resourceId,
                timestamp: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
            orderBy: { timestamp: 'desc' },
            skip: options?.skip,
            take: options?.take,
        });
    }

    /**
     * Obtener estadísticas de acceso para un recurso
     */
    async getAccessStats(
        resource: AuditResource,
        resourceId: string,
        options?: {
            startDate?: Date;
            endDate?: Date;
        },
    ) {
        const logs = await this.prisma.auditLog.findMany({
            where: {
                resource,
                resourceId,
                timestamp: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
        });

        return {
            totalAccesses: logs.length,
            uniqueActors: new Set(logs.map(l => l.actorId)).size,
            byAction: logs.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            failedAttempts: logs.filter(l => !l.success).length,
        };
    }
}
