// src/modules/audit/export-record.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { LogExportDto } from './interfaces/audit.interfaces';
import { AuditResource } from '@prisma/client';

/**
 * ExportRecordService
 * 
 * Registra y rastrea exportaciones de datos clínicos
 * con trazabilidad completa.
 */
@Injectable()
export class ExportRecordService {
    private readonly logger = new Logger(ExportRecordService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Registrar una exportación
     */
    async recordExport(
        dto: LogExportDto,
        actor: AuthenticatedUser,
    ): Promise<{ exportRecordId: string }> {
        // Crear registro de exportación
        const record = await this.prisma.exportRecord.create({
            data: {
                exportedBy: actor.id,
                exportedByIp: actor.ip,
                resourceType: dto.resourceType,
                resourceId: dto.resourceId,
                patientId: dto.patientId,
                format: dto.format,
                includesPII: dto.includesPII,
                maskedPII: dto.maskedPII,
                success: dto.success ?? true,
                recordCount: dto.recordCount ?? 1,
                fileSizeBytes: dto.fileSizeBytes,
            },
        });

        // Auditar la exportación
        await this.auditService.logExport({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            exportRecordId: record.id,
            resource: this.mapResourceType(dto.resourceType),
            resourceId: dto.resourceId,
            patientId: dto.patientId,
            format: dto.format,
            includesPII: dto.includesPII,
            maskedPII: dto.maskedPII,
            recordCount: dto.recordCount ?? 1,
        });

        this.logger.log(
            `Export recorded: ${record.id} - ${dto.resourceType}:${dto.resourceId} by ${actor.email}`,
        );

        return { exportRecordId: record.id };
    }

    /**
     * Listar exportaciones de un recurso
     */
    async findByResource(
        resourceType: string,
        resourceId: string,
        options?: {
            skip?: number;
            take?: number;
            startDate?: Date;
            endDate?: Date;
        },
    ) {
        return this.prisma.exportRecord.findMany({
            where: {
                resourceType,
                resourceId,
                exportedAt: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
            orderBy: { exportedAt: 'desc' },
            skip: options?.skip,
            take: options?.take || 50,
        });
    }

    /**
     * Listar exportaciones de un paciente
     */
    async findByPatient(
        patientId: string,
        options?: {
            skip?: number;
            take?: number;
            startDate?: Date;
            endDate?: Date;
        },
    ) {
        return this.prisma.exportRecord.findMany({
            where: {
                patientId,
                exportedAt: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
            orderBy: { exportedAt: 'desc' },
            skip: options?.skip,
            take: options?.take || 50,
        });
    }

    /**
     * Listar exportaciones de un usuario
     */
    async findByUser(
        userId: string,
        options?: {
            skip?: number;
            take?: number;
            startDate?: Date;
            endDate?: Date;
        },
    ) {
        return this.prisma.exportRecord.findMany({
            where: {
                exportedBy: userId,
                exportedAt: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
            orderBy: { exportedAt: 'desc' },
            skip: options?.skip,
            take: options?.take || 50,
        });
    }

    /**
     * Estadísticas de exportación
     */
    async getStats(options?: {
        startDate?: Date;
        endDate?: Date;
    }) {
        const records = await this.prisma.exportRecord.findMany({
            where: {
                exportedAt: {
                    gte: options?.startDate,
                    lte: options?.endDate,
                },
            },
        });

        return {
            totalExports: records.length,
            byFormat: records.reduce((acc, r) => {
                acc[r.format] = (acc[r.format] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            byResourceType: records.reduce((acc, r) => {
                acc[r.resourceType] = (acc[r.resourceType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            withPII: records.filter(r => r.includesPII).length,
            withMaskedPII: records.filter(r => r.maskedPII).length,
            uniqueExporters: new Set(records.map(r => r.exportedBy)).size,
        };
    }

    private mapResourceType(resourceType: string): AuditResource {
        const mapping: Record<string, AuditResource> = {
            SESSION: AuditResource.CLINICAL_SESSION,
            PATIENT_HISTORY: AuditResource.PATIENT,
            AUDIT_REPORT: AuditResource.USER,
        };
        return mapping[resourceType] || AuditResource.CLINICAL_SESSION;
    }
}
