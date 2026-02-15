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
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../modules/audit/audit.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const uuid_1 = require("uuid");
let TokenService = TokenService_1 = class TokenService {
    constructor(jwtService, configService, prisma, auditService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(TokenService_1.name);
        this.accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN', '15m');
        this.refreshTokenExpiry = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
        this.refreshTokenExpiryMs = this.parseExpiry(this.refreshTokenExpiry);
    }
    generateFingerprint(ip, userAgent) {
        const data = `${ip}:${userAgent || 'unknown'}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    async createTokenPair(user, ip, userAgent, existingFamilyId) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.globalRole,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.accessTokenExpiry,
        });
        const refreshTokenValue = this.generateSecureToken();
        const fingerprint = this.generateFingerprint(ip, userAgent);
        const familyId = existingFamilyId || (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + this.refreshTokenExpiryMs);
        await this.prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: user.id,
                expiresAt,
                fingerprint,
                familyId,
                ipAddress: ip,
                userAgent: userAgent?.substring(0, 500),
            },
        });
        this.logger.log(`Token pair created for user ${user.email}, family: ${familyId}`);
        return {
            accessToken,
            refreshToken: refreshTokenValue,
            expiresIn: this.parseExpiry(this.accessTokenExpiry) / 1000,
        };
    }
    async rotateRefreshToken(oldTokenValue, ip, userAgent) {
        const token = await this.prisma.refreshToken.findUnique({
            where: { token: oldTokenValue },
            include: { user: true },
        });
        if (!token) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (token.isRevoked) {
            this.logger.warn(`SECURITY: Token reuse detected for family ${token.familyId}`);
            await this.revokeTokenFamily(token.familyId, 'reuse_detected');
            await this.auditService.log({
                actorId: token.userId,
                actorIp: ip,
                action: client_1.AuditAction.ACCESS_DENIED,
                resource: client_1.AuditResource.USER,
                resourceId: token.userId,
                success: false,
                failureReason: 'Token reuse detected - family revoked',
                details: { familyId: token.familyId, event: 'token_reuse' },
            });
            throw new common_1.UnauthorizedException('Token has been revoked due to suspicious activity');
        }
        if (token.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token expired');
        }
        const currentFingerprint = this.generateFingerprint(ip, userAgent);
        if (token.fingerprint !== currentFingerprint) {
            this.logger.warn(`SECURITY: Fingerprint mismatch for user ${token.userId}`);
            await this.auditService.log({
                actorId: token.userId,
                actorIp: ip,
                action: client_1.AuditAction.ACCESS_DENIED,
                resource: client_1.AuditResource.USER,
                resourceId: token.userId,
                success: false,
                failureReason: 'Fingerprint mismatch',
                details: {
                    event: 'fingerprint_mismatch',
                    expectedIp: token.ipAddress,
                    actualIp: ip,
                },
            });
            throw new common_1.UnauthorizedException('Session binding mismatch');
        }
        await this.prisma.refreshToken.update({
            where: { id: token.id },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokeReason: 'rotation',
            },
        });
        return this.createTokenPair(token.user, ip, userAgent, token.familyId);
    }
    async revokeAllUserTokens(userId, reason) {
        const result = await this.prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });
        this.logger.log(`Revoked ${result.count} tokens for user ${userId}, reason: ${reason}`);
        return result.count;
    }
    async revokeTokenFamily(familyId, reason) {
        const result = await this.prisma.refreshToken.updateMany({
            where: {
                familyId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });
        this.logger.warn(`Revoked ${result.count} tokens in family ${familyId}, reason: ${reason}`);
        return result.count;
    }
    async revokeToken(tokenValue) {
        await this.prisma.refreshToken.updateMany({
            where: { token: tokenValue },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokeReason: 'logout',
            },
        });
    }
    verifyAccessToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid access token');
        }
    }
    async cleanupExpiredTokens() {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    {
                        isRevoked: true,
                        revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                    },
                ],
            },
        });
        this.logger.log(`Cleaned up ${result.count} expired/old tokens`);
        return result.count;
    }
    generateSecureToken() {
        return crypto.randomBytes(64).toString('base64url');
    }
    parseExpiry(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 15 * 60 * 1000;
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 15 * 60 * 1000;
        }
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TokenService);
//# sourceMappingURL=token.service.js.map