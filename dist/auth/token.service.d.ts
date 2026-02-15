import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { User } from '@prisma/client';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    private readonly refreshTokenExpiryMs;
    constructor(jwtService: JwtService, configService: ConfigService, prisma: PrismaService, auditService: AuditService);
    generateFingerprint(ip: string, userAgent: string): string;
    createTokenPair(user: User, ip: string, userAgent: string, existingFamilyId?: string): Promise<TokenPair>;
    rotateRefreshToken(oldTokenValue: string, ip: string, userAgent: string): Promise<TokenPair>;
    revokeAllUserTokens(userId: string, reason: string): Promise<number>;
    revokeTokenFamily(familyId: string, reason: string): Promise<number>;
    revokeToken(tokenValue: string): Promise<void>;
    verifyAccessToken(token: string): JwtPayload;
    cleanupExpiredTokens(): Promise<number>;
    private generateSecureToken;
    private parseExpiry;
}
