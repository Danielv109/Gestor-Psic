import { PrismaService } from '../prisma/prisma.service';
import { TokenService, TokenPair } from './token.service';
import { AuditService } from '../modules/audit/audit.service';
import { LoginDto, LoginResponseDto } from './dto';
export declare class AuthService {
    private readonly prisma;
    private readonly tokenService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, tokenService: TokenService, auditService: AuditService);
    login(dto: LoginDto, ip: string, userAgent: string): Promise<LoginResponseDto>;
    refreshTokens(refreshToken: string, ip: string, userAgent: string): Promise<TokenPair>;
    logout(refreshToken: string, userId: string, ip: string): Promise<void>;
    logoutAll(userId: string, ip: string): Promise<number>;
    changePassword(userId: string, currentPassword: string, newPassword: string, ip: string): Promise<void>;
    invalidateOnSecurityEvent(userId: string, event: 'mfa_change' | 'account_disabled' | 'suspicious_activity', ip: string): Promise<void>;
    private verifyPassword;
    private hashPassword;
    private logFailedLogin;
}
