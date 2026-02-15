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
var ExportRecordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportRecordService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("./audit.service");
const client_1 = require("@prisma/client");
let ExportRecordService = ExportRecordService_1 = class ExportRecordService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(ExportRecordService_1.name);
    }
    async recordExport(dto, actor) {
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
        this.logger.log(`Export recorded: ${record.id} - ${dto.resourceType}:${dto.resourceId} by ${actor.email}`);
        return { exportRecordId: record.id };
    }
    async findByResource(resourceType, resourceId, options) {
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
    async findByPatient(patientId, options) {
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
    async findByUser(userId, options) {
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
    async getStats(options) {
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
            }, {}),
            byResourceType: records.reduce((acc, r) => {
                acc[r.resourceType] = (acc[r.resourceType] || 0) + 1;
                return acc;
            }, {}),
            withPII: records.filter(r => r.includesPII).length,
            withMaskedPII: records.filter(r => r.maskedPII).length,
            uniqueExporters: new Set(records.map(r => r.exportedBy)).size,
        };
    }
    mapResourceType(resourceType) {
        const mapping = {
            SESSION: client_1.AuditResource.CLINICAL_SESSION,
            PATIENT_HISTORY: client_1.AuditResource.PATIENT,
            AUDIT_REPORT: client_1.AuditResource.USER,
        };
        return mapping[resourceType] || client_1.AuditResource.CLINICAL_SESSION;
    }
};
exports.ExportRecordService = ExportRecordService;
exports.ExportRecordService = ExportRecordService = ExportRecordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ExportRecordService);
//# sourceMappingURL=export-record.service.js.map