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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemBootstrapController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const system_bootstrap_service_1 = require("./system-bootstrap.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let SystemBootstrapController = class SystemBootstrapController {
    constructor(bootstrapService, configService) {
        this.bootstrapService = bootstrapService;
        this.configService = configService;
    }
    async bootstrap(dto, setupToken, req) {
        if (!this.bootstrapService.isBootstrapEnabled()) {
            throw new common_1.NotFoundException('Este endpoint no está disponible.');
        }
        const alreadyCompleted = await this.bootstrapService.isBootstrapCompleted();
        if (alreadyCompleted) {
            throw new common_1.GoneException('El bootstrap del sistema ya fue completado. Este endpoint está permanentemente deshabilitado.');
        }
        if (!setupToken || !this.bootstrapService.validateSetupToken(setupToken)) {
            throw new common_1.ForbiddenException('Token de configuración inválido o ausente.');
        }
        if (!dto.email || !dto.password || !dto.firstName || !dto.lastName) {
            throw new common_1.ForbiddenException('Datos incompletos. Se requiere: email, password, firstName, lastName.');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.email)) {
            throw new common_1.ForbiddenException('Formato de email inválido.');
        }
        if (dto.password.length < 12) {
            throw new common_1.ForbiddenException('La contraseña debe tener al menos 12 caracteres.');
        }
        const ip = this.extractIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        return this.bootstrapService.executeBootstrap(dto, ip, userAgent);
    }
    extractIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }
};
exports.SystemBootstrapController = SystemBootstrapController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('bootstrap'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 1, ttl: 86400000 } }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-setup-token')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SystemBootstrapController.prototype, "bootstrap", null);
exports.SystemBootstrapController = SystemBootstrapController = __decorate([
    (0, common_1.Controller)('system'),
    __metadata("design:paramtypes", [system_bootstrap_service_1.SystemBootstrapService,
        config_1.ConfigService])
], SystemBootstrapController);
//# sourceMappingURL=system-bootstrap.controller.js.map