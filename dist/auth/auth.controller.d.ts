import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request): Promise<import("./dto").LoginResponseDto>;
    refresh(dto: RefreshTokenDto, req: Request): Promise<import("./token.service").TokenPair>;
    logout(dto: RefreshTokenDto, user: AuthenticatedUser): Promise<void>;
    logoutAll(user: AuthenticatedUser): Promise<{
        revokedTokens: number;
    }>;
    changePassword(dto: {
        currentPassword: string;
        newPassword: string;
    }, user: AuthenticatedUser): Promise<void>;
    private extractIp;
}
