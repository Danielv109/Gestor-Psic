// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../modules/audit/audit.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
                },
            }),
            inject: [ConfigService],
        }),
        PrismaModule,
        AuditModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
    ],
    exports: [
        AuthService,
        TokenService,
        JwtAuthGuard,
        RolesGuard,
        JwtModule,
    ],
})
export class AuthModule { }
