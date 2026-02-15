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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(input) {
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
    async logAccessDenied(input) {
        await this.log({
            actorId: input.actorId,
            actorIp: input.actorIp,
            action: client_1.AuditAction.ACCESS_DENIED,
            resource: input.resource,
            resourceId: input.resourceId,
            success: false,
            failureReason: input.reason,
        });
    }
    async findByPatient(patientId, options) {
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
    async findByActor(actorId, options) {
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
    sanitizeDetails(details) {
        const sensitiveKeys = [
            'password',
            'token',
            'secret',
            'key',
            'content',
            'narrative',
            'note',
        ];
        const sanitized = {};
        for (const [key, value] of Object.entries(details)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = sensitiveKeys.some((k) => lowerKey.includes(k));
            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeDetails(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    async logSensitiveAccess(input) {
        await this.log({
            actorId: input.actorId,
            actorRole: input.actorRole,
            actorIp: input.actorIp,
            action: client_1.AuditAction.READ,
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
    async logExport(input) {
        await this.log({
            actorId: input.actorId,
            actorRole: input.actorRole,
            actorIp: input.actorIp,
            action: client_1.AuditAction.EXPORT,
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
    async findByResource(resource, resourceId, options) {
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
    async getAccessStats(resource, resourceId, options) {
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
            }, {}),
            failedAttempts: logs.filter(l => !l.success).length,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map