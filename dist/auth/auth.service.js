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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const token_service_1 = require("./token.service");
const audit_service_1 = require("../modules/audit/audit.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, tokenService, auditService) {
        this.prisma = prisma;
        this.tokenService = tokenService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(dto, ip, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user || user.deletedAt) {
            await this.logFailedLogin(dto.email, ip, 'User not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            await this.logFailedLogin(dto.email, ip, 'Account disabled');
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        const passwordValid = await this.verifyPassword(dto.password, user.passwordHash);
        if (!passwordValid) {
            await this.logFailedLogin(dto.email, ip, 'Invalid password');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.tokenService.createTokenPair(user, ip, userAgent);
        await this.auditService.log({
            actorId: user.id,
            actorIp: ip,
            action: client_1.AuditAction.LOGIN,
            resource: client_1.AuditResource.USER,
            resourceId: user.id,
            success: true,
            details: { userAgent: userAgent?.substring(0, 100) },
        });
        this.logger.log(`User ${user.email} logged in from ${ip}`);
        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                globalRole: user.globalRole,
            },
        };
    }
    async refreshTokens(refreshToken, ip, userAgent) {
        return this.tokenService.rotateRefreshToken(refreshToken, ip, userAgent);
    }
    async logout(refreshToken, userId, ip) {
        await this.tokenService.revokeToken(refreshToken);
        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: client_1.AuditAction.LOGOUT,
            resource: client_1.AuditResource.USER,
            resourceId: userId,
            success: true,
        });
        this.logger.log(`User ${userId} logged out`);
    }
    async logoutAll(userId, ip) {
        const count = await this.tokenService.revokeAllUserTokens(userId, 'logout_all');
        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: client_1.AuditAction.LOGOUT,
            resource: client_1.AuditResource.USER,
            resourceId: userId,
            success: true,
            details: { type: 'global', revokedTokens: count },
        });
        return count;
    }
    async changePassword(userId, currentPassword, newPassword, ip) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        const newHash = await this.hashPassword(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                passwordChangedAt: new Date(),
            },
        });
        await this.tokenService.revokeAllUserTokens(userId, 'password_change');
        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.USER,
            resourceId: userId,
            success: true,
            details: { field: 'password', tokensRevoked: true },
        });
        this.logger.log(`Password changed for user ${userId}, all tokens revoked`);
    }
    async invalidateOnSecurityEvent(userId, event, ip) {
        await this.tokenService.revokeAllUserTokens(userId, `security_${event}`);
        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: client_1.AuditAction.ACCESS_DENIED,
            resource: client_1.AuditResource.USER,
            resourceId: userId,
            success: true,
            details: { securityEvent: event, tokensRevoked: true },
        });
        this.logger.warn(`Security event ${event} for user ${userId}, tokens revoked`);
    }
    async verifyPassword(plainPassword, hash) {
        const testHash = crypto
            .createHash('sha256')
            .update(plainPassword)
            .digest('hex');
        return testHash === hash;
    }
    async hashPassword(password) {
        return crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');
    }
    async logFailedLogin(email, ip, reason) {
        await this.auditService.log({
            actorId: undefined,
            actorIp: ip,
            action: client_1.AuditAction.LOGIN,
            resource: client_1.AuditResource.USER,
            resourceId: '00000000-0000-0000-0000-000000000000',
            success: false,
            failureReason: reason,
            details: { attemptedEmail: email },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        token_service_1.TokenService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map