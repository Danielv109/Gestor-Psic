// src/auth/auth.controller.ts
import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /auth/login
     * Autenticación de usuario
     * Rate limit: 5 req/min
     */
    @Public()
    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto, @Req() req: Request) {
        const ip = this.extractIp(req);
        const userAgent = req.headers['user-agent'] || '';
        return this.authService.login(dto, ip, userAgent);
    }

    /**
     * POST /auth/refresh
     * Rotar refresh token
     * Rate limit: 10 req/min
     */
    @Public()
    @Post('refresh')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } })
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
        const ip = this.extractIp(req);
        const userAgent = req.headers['user-agent'] || '';
        return this.authService.refreshTokens(dto.refreshToken, ip, userAgent);
    }

    /**
     * POST /auth/logout
     * Logout (revoca token actual)
     */
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @Body() dto: RefreshTokenDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.authService.logout(dto.refreshToken, user.id, user.ip);
    }

    /**
     * POST /auth/logout-all
     * Logout global (revoca TODOS los tokens)
     */
    @UseGuards(JwtAuthGuard)
    @Post('logout-all')
    @HttpCode(HttpStatus.OK)
    async logoutAll(@CurrentUser() user: AuthenticatedUser) {
        const count = await this.authService.logoutAll(user.id, user.ip);
        return { revokedTokens: count };
    }

    /**
     * POST /auth/change-password
     * Cambiar contraseña (invalida todos los tokens)
     */
    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @HttpCode(HttpStatus.NO_CONTENT)
    async changePassword(
        @Body() dto: { currentPassword: string; newPassword: string },
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.authService.changePassword(
            user.id,
            dto.currentPassword,
            dto.newPassword,
            user.ip,
        );
    }

    private extractIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }
}
