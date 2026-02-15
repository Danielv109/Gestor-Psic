// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../token.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET'),
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser> {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user || user.deletedAt || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        // Verificar si el token fue emitido antes del último cambio de password
        if (payload.iat && user.passwordChangedAt) {
            const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
            if (payload.iat < passwordChangedTimestamp) {
                throw new UnauthorizedException('Token invalidated by password change');
            }
        }

        // Extraer IP y UserAgent del request
        const ip = this.extractIp(req);
        const userAgent = req.headers['user-agent'];

        return {
            id: user.id,
            email: user.email,
            globalRole: user.globalRole,
            firstName: user.firstName,
            lastName: user.lastName,
            ip,
            userAgent,
        };
    }

    private extractIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }
}
