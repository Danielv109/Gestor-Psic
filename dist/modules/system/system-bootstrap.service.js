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
exports.SystemBootstrapService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const bootstrap_interfaces_1 = require("./interfaces/bootstrap.interfaces");
let SystemBootstrapService = class SystemBootstrapService {
    constructor(prisma, configService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.auditService = auditService;
    }
    isBootstrapEnabled() {
        const setupToken = this.configService.get('SYSTEM_SETUP_TOKEN');
        return !!setupToken && setupToken.length > 0;
    }
    validateSetupToken(providedToken) {
        const setupToken = this.configService.get('SYSTEM_SETUP_TOKEN');
        if (!setupToken) {
            return false;
        }
        return providedToken === setupToken;
    }
    async isBootstrapCompleted() {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key: bootstrap_interfaces_1.BOOTSTRAP_COMPLETED_KEY },
        });
        return config?.value === 'true';
    }
    async executeBootstrap(dto, ip, userAgent) {
        const alreadyCompleted = await this.isBootstrapCompleted();
        if (alreadyCompleted) {
            throw new common_1.GoneException('El bootstrap del sistema ya fue completado. Este endpoint está deshabilitado.');
        }
        const existingUsers = await this.prisma.user.count();
        if (existingUsers > 0) {
            throw new common_1.ConflictException('Ya existen usuarios en el sistema. Bootstrap no permitido.');
        }
        const passwordHash = crypto
            .createHash('sha256')
            .update(dto.password)
            .digest('hex');
        const now = new Date();
        const user = await this.prisma.user.create({
            data: {
                email: dto.email.toLowerCase().trim(),
                passwordHash,
                globalRole: client_1.GlobalRole.SUPERVISOR,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                licenseNumber: dto.licenseNumber?.trim() || null,
                isActive: true,
                passwordChangedAt: now,
            },
        });
        await this.prisma.systemConfig.create({
            data: {
                key: bootstrap_interfaces_1.BOOTSTRAP_COMPLETED_KEY,
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
        await this.auditService.log({
            actorId: user.id,
            actorRole: client_1.GlobalRole.SUPERVISOR,
            actorIp: ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.USER,
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
};
exports.SystemBootstrapService = SystemBootstrapService;
exports.SystemBootstrapService = SystemBootstrapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], SystemBootstrapService);
//# sourceMappingURL=system-bootstrap.service.js.map