// src/modules/export/export.controller.ts
import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    ParseUUIDPipe,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ExportService } from './export.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckPolicies } from '../../common/decorators/policies.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';
import { ExportFormat } from './interfaces/export.interfaces';
import { ExportSessionPolicy } from './policies/export-session.policy';
import { ExportPatientPolicy } from './policies/export-patient.policy';
import { PoliciesGuard } from '../../common/guards/policies.guard';

// DTOs
class ExportOptionsDto {
    format?: ExportFormat;
    includeNarrative?: boolean;
    includePatientDetails?: boolean;
    maskPII?: boolean;
    timezone?: string;
}

@Controller('export')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 req / 5 min
export class ExportController {
    constructor(private readonly exportService: ExportService) { }

    /**
     * POST /export/session/:id
     * Exportar sesión clínica
     * Rate limit: 3 req/5min (controller-level)
     */
    @Post('session/:id')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.AUDITOR)
    @UseGuards(PoliciesGuard)
    @CheckPolicies(ExportSessionPolicy)
    @HttpCode(HttpStatus.OK)
    async exportSession(
        @Param('id', ParseUUIDPipe) sessionId: string,
        @Body() options: ExportOptionsDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const exportDoc = await this.exportService.exportSession(sessionId, user, {
            format: options.format || ExportFormat.JSON,
            includeNarrative: options.includeNarrative ?? true,
            includePatientDetails: options.includePatientDetails ?? true,
            maskPII: options.maskPII ?? false,
            timezone: options.timezone,
        });

        return exportDoc;
    }

    /**
     * POST /export/session/:id/pdf-structure
     * Obtener estructura para generar PDF
     */
    @Post('session/:id/pdf-structure')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.AUDITOR)
    @UseGuards(PoliciesGuard)
    @CheckPolicies(ExportSessionPolicy)
    @HttpCode(HttpStatus.OK)
    async getSessionPdfStructure(
        @Param('id', ParseUUIDPipe) sessionId: string,
        @Body() options: ExportOptionsDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const exportDoc = await this.exportService.exportSession(sessionId, user, {
            format: ExportFormat.PDF,
            includeNarrative: options.includeNarrative ?? true,
            includePatientDetails: options.includePatientDetails ?? true,
            maskPII: options.maskPII ?? false,
            timezone: options.timezone,
        });

        const pdfStructure = this.exportService.generatePdfStructure(exportDoc);

        return {
            document: exportDoc,
            pdfStructure,
        };
    }

    /**
     * POST /export/patient/:id/history
     * Exportar historial de paciente
     */
    @Post('patient/:id/history')
    @Roles(GlobalRole.SUPERVISOR, GlobalRole.AUDITOR)
    @UseGuards(PoliciesGuard)
    @CheckPolicies(ExportPatientPolicy)
    @HttpCode(HttpStatus.OK)
    async exportPatientHistory(
        @Param('id', ParseUUIDPipe) patientId: string,
        @Body() options: ExportOptionsDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const exportDoc = await this.exportService.exportPatientHistory(
            patientId,
            user,
            {
                format: options.format || ExportFormat.JSON,
                includeNarrative: options.includeNarrative ?? true,
                includePatientDetails: options.includePatientDetails ?? true,
                maskPII: options.maskPII ?? false,
                timezone: options.timezone,
            },
        );

        return exportDoc;
    }

    /**
     * GET /export/permissions
     * Ver permisos de exportación del usuario actual
     */
    @Get('permissions')
    @Roles(
        GlobalRole.TERAPEUTA,
        GlobalRole.SUPERVISOR,
        GlobalRole.AUDITOR,
        GlobalRole.ASISTENTE,
    )
    async getMyExportPermissions(@CurrentUser() user: AuthenticatedUser) {
        const { EXPORT_PERMISSIONS } = await import('./interfaces/export.interfaces');
        const permissions = EXPORT_PERMISSIONS[user.globalRole];

        return {
            role: user.globalRole,
            permissions,
            notes: this.getPermissionNotes(user.globalRole),
        };
    }

    private getPermissionNotes(role: GlobalRole): string[] {
        const notes: string[] = [];

        switch (role) {
            case GlobalRole.TERAPEUTA:
                notes.push('Puede exportar sesiones de sus pacientes');
                notes.push('Puede ver y exportar su nota sombra propia');
                notes.push('No puede hacer exportación masiva');
                break;
            case GlobalRole.SUPERVISOR:
                notes.push('Puede exportar sesiones de todos los pacientes supervisados');
                notes.push('No puede ver notas sombra de otros terapeutas');
                notes.push('Puede hacer exportación masiva');
                break;
            case GlobalRole.AUDITOR:
                notes.push('Puede exportar para auditoría');
                notes.push('PII de pacientes está enmascarado');
                notes.push('NUNCA puede ver notas sombra');
                notes.push('Solo puede ver narrativa clínica para auditoría');
                break;
            case GlobalRole.ASISTENTE:
                notes.push('No tiene permisos de exportación');
                break;
        }

        return notes;
    }
}
