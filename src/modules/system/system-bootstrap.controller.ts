// src/modules/system/system-bootstrap.controller.ts
import {
    Controller,
    Post,
    Body,
    Headers,
    Req,
    HttpCode,
    HttpStatus,
    ForbiddenException,
    GoneException,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SystemBootstrapService } from './system-bootstrap.service';
import { BootstrapUserDto } from './interfaces/bootstrap.interfaces';
import { Public } from '../../common/decorators/public.decorator';

@Controller('system')
export class SystemBootstrapController {
    constructor(
        private readonly bootstrapService: SystemBootstrapService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * POST /system/bootstrap
     * 
     * Endpoint de bootstrap para inicializar el sistema con el primer usuario.
     * 
     * Requisitos:
     * - SYSTEM_SETUP_TOKEN debe estar configurado en env
     * - Header x-setup-token debe coincidir
     * - Sistema debe estar vacío (0 usuarios)
     * - Solo puede ejecutarse UNA vez
     * 
     * Rate limit: 1 req/24h (con control adicional en DB para lifetime)
     * Después de ejecutarse exitosamente:
     * - El endpoint devuelve 410 GONE en llamadas posteriores
     */
    @Public()
    @Post('bootstrap')
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 1, ttl: 86400000 } }) // 1 req / 24 hours
    @HttpCode(HttpStatus.CREATED)
    async bootstrap(
        @Body() dto: BootstrapUserDto,
        @Headers('x-setup-token') setupToken: string,
        @Req() req: Request,
    ) {
        // 1. Verificar que el endpoint esté habilitado
        if (!this.bootstrapService.isBootstrapEnabled()) {
            throw new NotFoundException(
                'Este endpoint no está disponible.',
            );
        }

        // 2. Verificar si ya se completó el bootstrap
        const alreadyCompleted = await this.bootstrapService.isBootstrapCompleted();
        if (alreadyCompleted) {
            throw new GoneException(
                'El bootstrap del sistema ya fue completado. Este endpoint está permanentemente deshabilitado.',
            );
        }

        // 3. Validar token de setup
        if (!setupToken || !this.bootstrapService.validateSetupToken(setupToken)) {
            throw new ForbiddenException(
                'Token de configuración inválido o ausente.',
            );
        }

        // 4. Validar datos mínimos
        if (!dto.email || !dto.password || !dto.firstName || !dto.lastName) {
            throw new ForbiddenException(
                'Datos incompletos. Se requiere: email, password, firstName, lastName.',
            );
        }

        // 5. Validar formato de email básico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.email)) {
            throw new ForbiddenException('Formato de email inválido.');
        }

        // 6. Validar password mínimo
        if (dto.password.length < 12) {
            throw new ForbiddenException(
                'La contraseña debe tener al menos 12 caracteres.',
            );
        }

        // 7. Extraer IP y userAgent
        const ip = this.extractIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';

        // 8. Ejecutar bootstrap
        return this.bootstrapService.executeBootstrap(dto, ip, userAgent);
    }

    private extractIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'];
        if (typeof forwarded === 'string') {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.socket?.remoteAddress || 'unknown';
    }
}
