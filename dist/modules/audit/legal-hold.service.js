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
var LegalHoldService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalHoldService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("./audit.service");
const client_1 = require("@prisma/client");
let LegalHoldService = LegalHoldService_1 = class LegalHoldService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(LegalHoldService_1.name);
    }
    async createHold(dto, actor) {
        if (actor.globalRole !== client_1.GlobalRole.SUPERVISOR) {
            throw new common_1.ForbiddenException('Solo supervisores pueden crear retenciones legales');
        }
        await this.validateResourceExists(dto.resourceType, dto.resourceId);
        const existingHold = await this.prisma.legalHold.findFirst({
            where: {
                resourceType: dto.resourceType,
                resourceId: dto.resourceId,
                isActive: true,
            },
        });
        if (existingHold) {
            throw new common_1.BadRequestException(`El recurso ya tiene una retención legal activa (ID: ${existingHold.id})`);
        }
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
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
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
        this.logger.warn(`Legal Hold created: ${hold.id} on ${dto.resourceType}:${dto.resourceId}`);
        return { id: hold.id };
    }
    async releaseHold(holdId, dto, actor) {
        if (actor.globalRole !== client_1.GlobalRole.SUPERVISOR) {
            throw new common_1.ForbiddenException('Solo supervisores pueden liberar retenciones legales');
        }
        const hold = await this.prisma.legalHold.findUnique({
            where: { id: holdId },
        });
        if (!hold) {
            throw new common_1.NotFoundException(`Retención legal no encontrada: ${holdId}`);
        }
        if (!hold.isActive) {
            throw new common_1.BadRequestException('La retención legal ya fue liberada');
        }
        await this.prisma.legalHold.update({
            where: { id: holdId },
            data: {
                isActive: false,
                releasedBy: actor.id,
                releasedAt: new Date(),
                releaseReason: dto.releaseReason,
            },
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
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
    async checkHold(resourceType, resourceId) {
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
    async assertNoHold(resourceType, resourceId) {
        const check = await this.checkHold(resourceType, resourceId);
        if (check.hasHold) {
            const hold = check.holds[0];
            throw new common_1.ForbiddenException(`El recurso tiene una retención legal activa. ` +
                `Razón: ${hold.reason}. Caso: ${hold.caseNumber || 'N/A'}`);
        }
    }
    async listActiveHolds(options) {
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
    async validateResourceExists(resourceType, resourceId) {
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
                throw new common_1.BadRequestException(`Tipo de recurso no válido: ${resourceType}`);
        }
        if (!exists) {
            throw new common_1.NotFoundException(`Recurso no encontrado: ${resourceType}:${resourceId}`);
        }
    }
    mapResourceType(resourceType) {
        const mapping = {
            PATIENT: client_1.AuditResource.PATIENT,
            CLINICAL_SESSION: client_1.AuditResource.CLINICAL_SESSION,
            SHADOW_NOTE: client_1.AuditResource.SHADOW_NOTE,
        };
        return mapping[resourceType] || client_1.AuditResource.CLINICAL_SESSION;
    }
};
exports.LegalHoldService = LegalHoldService;
exports.LegalHoldService = LegalHoldService = LegalHoldService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], LegalHoldService);
//# sourceMappingURL=legal-hold.service.js.map