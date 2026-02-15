// src/modules/audit/legal-hold.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
    CreateLegalHoldDto,
    ReleaseLegalHoldDto,
    LegalHoldCheckResult,
} from './interfaces/audit.interfaces';
import { AuditAction, AuditResource, GlobalRole } from '@prisma/client';

/**
 * LegalHoldService
 * 
 * Gestiona retenciones legales de recursos clínicos.
 * Los recursos bajo Legal Hold NO pueden ser eliminados ni modificados.
 */
@Injectable()
export class LegalHoldService {
    private readonly logger = new Logger(LegalHoldService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Crear una retención legal
     * Solo SUPERVISOR puede crear holds
     */
    async createHold(
        dto: CreateLegalHoldDto,
        actor: AuthenticatedUser,
    ): Promise<{ id: string }> {
        // Solo SUPERVISOR puede crear holds
        if (actor.globalRole !== GlobalRole.SUPERVISOR) {
            throw new ForbiddenException('Solo supervisores pueden crear retenciones legales');
        }

        // Verificar que el recurso existe
        await this.validateResourceExists(dto.resourceType, dto.resourceId);

        // Verificar si ya existe un hold activo
        const existingHold = await this.prisma.legalHold.findFirst({
            where: {
                resourceType: dto.resourceType,
                resourceId: dto.resourceId,
                isActive: true,
            },
        });

        if (existingHold) {
            throw new BadRequestException(
                `El recurso ya tiene una retención legal activa (ID: ${existingHold.id})`,
            );
        }

        // Crear hold
        const hold = await this.prisma.legalHold.create({
            data: {
                resourceType: dto.resourceType,
                resourceId: dto.resourceId,
                reason: dto.reason,
                caseNumber: dto.caseNumber,
                holdUntil: dto.holdUntil,
                isActive: true,
                createdBy: actor.id,
            },
        });

        // Auditar creación
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: this.mapResourceType(dto.resourceType),
            resourceId: dto.resourceId,
            success: true,
            details: {
                action: 'create_legal_hold',
                holdId: hold.id,
                reason: dto.reason,
                caseNumber: dto.caseNumber,
            },
        });

        this.logger.warn(
            `Legal Hold created: ${hold.id} on ${dto.resourceType}:${dto.resourceId}`,
        );

        return { id: hold.id };
    }

    /**
     * Liberar una retención legal
     */
    async releaseHold(
        holdId: string,
        dto: ReleaseLegalHoldDto,
        actor: AuthenticatedUser,
    ): Promise<void> {
        // Solo SUPERVISOR puede liberar holds
        if (actor.globalRole !== GlobalRole.SUPERVISOR) {
            throw new ForbiddenException('Solo supervisores pueden liberar retenciones legales');
        }

        const hold = await this.prisma.legalHold.findUnique({
            where: { id: holdId },
        });

        if (!hold) {
            throw new NotFoundException(`Retención legal no encontrada: ${holdId}`);
        }

        if (!hold.isActive) {
            throw new BadRequestException('La retención legal ya fue liberada');
        }

        // Liberar hold
        await this.prisma.legalHold.update({
            where: { id: holdId },
            data: {
                isActive: false,
                releasedBy: actor.id,
                releasedAt: new Date(),
                releaseReason: dto.releaseReason,
            },
        });

        // Auditar liberación
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: this.mapResourceType(hold.resourceType),
            resourceId: hold.resourceId,
            success: true,
            details: {
                action: 'release_legal_hold',
                holdId,
                releaseReason: dto.releaseReason,
            },
        });

        this.logger.warn(`Legal Hold released: ${holdId}`);
    }

    /**
     * Verificar si un recurso tiene retención legal activa
     */
    async checkHold(
        resourceType: string,
        resourceId: string,
    ): Promise<LegalHoldCheckResult> {
        const holds = await this.prisma.legalHold.findMany({
            where: {
                resourceType,
                resourceId,
                isActive: true,
            },
        });

        return {
            hasHold: holds.length > 0,
            holds: holds.map((h) => ({
                id: h.id,
                reason: h.reason,
                caseNumber: h.caseNumber || undefined,
                holdUntil: h.holdUntil || undefined,
                createdAt: h.createdAt,
            })),
        };
    }

    /**
     * Verificar si un recurso puede ser eliminado/modificado
     * Lanza excepción si tiene hold activo
     */
    async assertNoHold(resourceType: string, resourceId: string): Promise<void> {
        const check = await this.checkHold(resourceType, resourceId);

        if (check.hasHold) {
            const hold = check.holds[0];
            throw new ForbiddenException(
                `El recurso tiene una retención legal activa. ` +
                `Razón: ${hold.reason}. Caso: ${hold.caseNumber || 'N/A'}`,
            );
        }
    }

    /**
     * Listar todos los holds activos
     */
    async listActiveHolds(options?: {
        resourceType?: string;
        skip?: number;
        take?: number;
    }) {
        return this.prisma.legalHold.findMany({
            where: {
                isActive: true,
                resourceType: options?.resourceType,
            },
            orderBy: { createdAt: 'desc' },
            skip: options?.skip,
            take: options?.take || 50,
        });
    }

    /**
     * Verificar que un recurso existe
     */
    private async validateResourceExists(
        resourceType: string,
        resourceId: string,
    ): Promise<void> {
        let exists = false;

        switch (resourceType) {
            case 'PATIENT':
                exists = !!(await this.prisma.patient.findUnique({
                    where: { id: resourceId },
                }));
                break;
            case 'CLINICAL_SESSION':
                exists = !!(await this.prisma.clinicalSession.findUnique({
                    where: { id: resourceId },
                }));
                break;
            case 'SHADOW_NOTE':
                exists = !!(await this.prisma.shadowNote.findUnique({
                    where: { id: resourceId },
                }));
                break;
            default:
                throw new BadRequestException(`Tipo de recurso no válido: ${resourceType}`);
        }

        if (!exists) {
            throw new NotFoundException(
                `Recurso no encontrado: ${resourceType}:${resourceId}`,
            );
        }
    }

    private mapResourceType(resourceType: string): AuditResource {
        const mapping: Record<string, AuditResource> = {
            PATIENT: AuditResource.PATIENT,
            CLINICAL_SESSION: AuditResource.CLINICAL_SESSION,
            SHADOW_NOTE: AuditResource.SHADOW_NOTE,
        };
        return mapping[resourceType] || AuditResource.CLINICAL_SESSION;
    }
}
