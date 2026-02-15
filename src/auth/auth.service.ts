// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService, TokenPair } from './token.service';
import { AuditService } from '../modules/audit/audit.service';
import { LoginDto, LoginResponseDto } from './dto';
import { AuditAction, AuditResource, User } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * AuthService
 * 
 * Servicio principal de autenticación con:
 * - Login con validación de credenciales
 * - Refresh token rotation
 * - Logout (revocación de tokens)
 * - Invalidación por eventos críticos
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenService: TokenService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Login de usuario
     */
    async login(
        dto: LoginDto,
        ip: string,
        userAgent: string,
    ): Promise<LoginResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });

        if (!user || user.deletedAt) {
            await this.logFailedLogin(dto.email, ip, 'User not found');
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            await this.logFailedLogin(dto.email, ip, 'Account disabled');
            throw new UnauthorizedException('Account is disabled');
        }

        // Verificar contraseña
        const passwordValid = await this.verifyPassword(dto.password, user.passwordHash);
        if (!passwordValid) {
            await this.logFailedLogin(dto.email, ip, 'Invalid password');
            throw new UnauthorizedException('Invalid credentials');
        }

        // Actualizar último login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Crear tokens
        const tokens = await this.tokenService.createTokenPair(user, ip, userAgent);

        // Audit log
        await this.auditService.log({
            actorId: user.id,
            actorIp: ip,
            action: AuditAction.LOGIN,
            resource: AuditResource.USER,
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

    /**
     * Refresh tokens (rotación segura)
     */
    async refreshTokens(
        refreshToken: string,
        ip: string,
        userAgent: string,
    ): Promise<TokenPair> {
        return this.tokenService.rotateRefreshToken(refreshToken, ip, userAgent);
    }

    /**
     * Logout (revoca token actual)
     */
    async logout(refreshToken: string, userId: string, ip: string): Promise<void> {
        await this.tokenService.revokeToken(refreshToken);

        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: AuditAction.LOGOUT,
            resource: AuditResource.USER,
            resourceId: userId,
            success: true,
        });

        this.logger.log(`User ${userId} logged out`);
    }

    /**
     * Logout global (revoca TODOS los tokens)
     */
    async logoutAll(userId: string, ip: string): Promise<number> {
        const count = await this.tokenService.revokeAllUserTokens(userId, 'logout_all');

        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: AuditAction.LOGOUT,
            resource: AuditResource.USER,
            resourceId: userId,
            success: true,
            details: { type: 'global', revokedTokens: count },
        });

        return count;
    }

    /**
     * Cambio de contraseña (invalida todos los tokens)
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
        ip: string,
    ): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        // Verificar contraseña actual
        const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash nueva contraseña
        const newHash = await this.hashPassword(newPassword);

        // Actualizar contraseña
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: newHash,
                passwordChangedAt: new Date(),
            },
        });

        // CRÍTICO: Revocar TODOS los tokens
        await this.tokenService.revokeAllUserTokens(userId, 'password_change');

        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.USER,
            resourceId: userId,
            success: true,
            details: { field: 'password', tokensRevoked: true },
        });

        this.logger.log(`Password changed for user ${userId}, all tokens revoked`);
    }

    /**
     * Invalidar tokens por evento de seguridad
     */
    async invalidateOnSecurityEvent(
        userId: string,
        event: 'mfa_change' | 'account_disabled' | 'suspicious_activity',
        ip: string,
    ): Promise<void> {
        await this.tokenService.revokeAllUserTokens(userId, `security_${event}`);

        await this.auditService.log({
            actorId: userId,
            actorIp: ip,
            action: AuditAction.ACCESS_DENIED,
            resource: AuditResource.USER,
            resourceId: userId,
            success: true,
            details: { securityEvent: event, tokensRevoked: true },
        });

        this.logger.warn(`Security event ${event} for user ${userId}, tokens revoked`);
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
        // Para producción: usar bcrypt o argon2
        // Aquí usamos hash simple para desarrollo
        const testHash = crypto
            .createHash('sha256')
            .update(plainPassword)
            .digest('hex');
        return testHash === hash;
    }

    private async hashPassword(password: string): Promise<string> {
        // Para producción: usar bcrypt o argon2
        return crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');
    }

    private async logFailedLogin(email: string, ip: string, reason: string): Promise<void> {
        await this.auditService.log({
            actorId: undefined,
            actorIp: ip,
            action: AuditAction.LOGIN,
            resource: AuditResource.USER,
            resourceId: '00000000-0000-0000-0000-000000000000',
            success: false,
            failureReason: reason,
            details: { attemptedEmail: email },
        });
    }
}
