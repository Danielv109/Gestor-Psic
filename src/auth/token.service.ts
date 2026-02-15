// src/auth/token.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { User, AuditAction, AuditResource } from '@prisma/client';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface JwtPayload {
    sub: string;      // userId
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * TokenService
 * 
 * Gestión segura de tokens JWT con:
 * - Fingerprint binding (IP + UserAgent)
 * - Rotación de refresh tokens
 * - Detección de reuso
 * - Invalidación por eventos críticos
 */
@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);
    private readonly accessTokenExpiry: string;
    private readonly refreshTokenExpiry: string;
    private readonly refreshTokenExpiryMs: number;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) {
        this.accessTokenExpiry = this.configService.get('JWT_EXPIRES_IN', '1h');
        this.refreshTokenExpiry = this.configService.get('JWT_REFRESH_EXPIRES_IN', '30d');
        this.refreshTokenExpiryMs = this.parseExpiry(this.refreshTokenExpiry);
    }

    /**
     * Genera fingerprint SHA-256 de IP + UserAgent
     * Usado para vincular token a la sesión del cliente
     */
    generateFingerprint(ip: string, userAgent: string): string {
        // Only bind to UserAgent (not IP) so WiFi/network changes
        // don't invalidate the session for therapists working from home
        const data = `ua:${userAgent || 'unknown'}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Crea par de tokens (access + refresh)
     */
    async createTokenPair(
        user: User,
        ip: string,
        userAgent: string,
        existingFamilyId?: string,
    ): Promise<TokenPair> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: user.globalRole,
        };

        // Access token (corta duración)
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.accessTokenExpiry,
        });

        // Refresh token (larga duración, almacenado en DB)
        const refreshTokenValue = this.generateSecureToken();
        const fingerprint = this.generateFingerprint(ip, userAgent);
        const familyId = existingFamilyId || uuidv4();
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

    /**
     * Rota refresh token
     * - Invalida token anterior
     * - Crea nuevo token en misma familia
     * - Detecta reuso (token ya revocado)
     */
    async rotateRefreshToken(
        oldTokenValue: string,
        ip: string,
        userAgent: string,
    ): Promise<TokenPair> {
        const token = await this.prisma.refreshToken.findUnique({
            where: { token: oldTokenValue },
            include: { user: true },
        });

        if (!token) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // DETECCIÓN DE REUSO: Token ya fue revocado
        if (token.isRevoked) {
            this.logger.warn(`SECURITY: Token reuse detected for family ${token.familyId}`);

            // Revocar TODA la familia
            await this.revokeTokenFamily(token.familyId, 'reuse_detected');

            await this.auditService.log({
                actorId: token.userId,
                actorIp: ip,
                action: AuditAction.ACCESS_DENIED,
                resource: AuditResource.USER,
                resourceId: token.userId,
                success: false,
                failureReason: 'Token reuse detected - family revoked',
                details: { familyId: token.familyId, event: 'token_reuse' },
            });

            throw new UnauthorizedException('Token has been revoked due to suspicious activity');
        }

        // Verificar expiración
        if (token.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token expired');
        }

        // Fingerprint check (UserAgent binding - soft check)
        const currentFingerprint = this.generateFingerprint(ip, userAgent);
        if (token.fingerprint !== currentFingerprint) {
            // Warn but DON'T reject — user may have updated browser
            this.logger.warn(`Fingerprint mismatch for user ${token.userId} (soft warning, allowing rotation)`);
        }

        // Revocar token actual (rotación)
        await this.prisma.refreshToken.update({
            where: { id: token.id },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokeReason: 'rotation',
            },
        });

        // Crear nuevo par de tokens en misma familia
        return this.createTokenPair(token.user, ip, userAgent, token.familyId);
    }

    /**
     * Revoca todos los tokens de un usuario
     * Usado en eventos críticos: cambio password, logout global, etc.
     */
    async revokeAllUserTokens(userId: string, reason: string): Promise<number> {
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

    /**
     * Revoca toda una familia de tokens
     * Usado cuando se detecta reuso de token
     */
    async revokeTokenFamily(familyId: string, reason: string): Promise<number> {
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

    /**
     * Revoca un token específico (logout)
     */
    async revokeToken(tokenValue: string): Promise<void> {
        await this.prisma.refreshToken.updateMany({
            where: { token: tokenValue },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
                revokeReason: 'logout',
            },
        });
    }

    /**
     * Valida un access token y retorna el payload
     */
    verifyAccessToken(token: string): JwtPayload {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid access token');
        }
    }

    /**
     * Limpia tokens expirados (mantenimiento)
     */
    async cleanupExpiredTokens(): Promise<number> {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    {
                        isRevoked: true,
                        revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 días
                    },
                ],
            },
        });

        this.logger.log(`Cleaned up ${result.count} expired/old tokens`);
        return result.count;
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private generateSecureToken(): string {
        return crypto.randomBytes(64).toString('base64url');
    }

    private parseExpiry(expiry: string): number {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 15 * 60 * 1000; // default 15m

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
}
