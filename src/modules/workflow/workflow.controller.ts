// src/modules/workflow/workflow.controller.ts
import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ClinicalWorkflowService } from './clinical-workflow.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';
import { ClinicalNarrative } from '../../crypto/interfaces/crypto.interfaces';

// DTOs
class StartSessionDto {
    initialNarrative?: {
        subjectiveReport?: string;
        objectiveObservation?: string;
        assessment?: string;
        plan?: string;
    };
}

class EndSessionDto {
    narrative: {
        subjectiveReport?: string;
        objectiveObservation?: string;
        assessment?: string;
        plan?: string;
        additionalNotes?: string;
    };
}

class SignSessionDto {
    signatureConfirmation: string; // "Confirmo que esta nota es correcta"
}

class CancelAppointmentDto {
    reason: string;
}

@Controller('workflow')
export class WorkflowController {
    constructor(private readonly workflowService: ClinicalWorkflowService) { }

    // ============================================================
    // APPOINTMENT TRANSITIONS
    // ============================================================

    /**
     * GET /workflow/appointment/:id/status
     * Obtener estado actual del workflow para una cita
     */
    @Get('appointment/:id/status')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async getWorkflowStatus(@Param('id', ParseUUIDPipe) id: string) {
        return this.workflowService.getWorkflowStatus(id);
    }

    /**
     * POST /workflow/appointment/:id/confirm
     * Confirmar cita: SCHEDULED → CONFIRMED
     */
    @Post('appointment/:id/confirm')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @HttpCode(HttpStatus.OK)
    async confirmAppointment(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const appointment = await this.workflowService.confirmAppointment(id, user);
        return {
            message: 'Cita confirmada',
            appointment,
        };
    }

    /**
     * POST /workflow/appointment/:id/no-show
     * Marcar paciente no asistió: SCHEDULED → NO_SHOW
     */
    @Post('appointment/:id/no-show')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @HttpCode(HttpStatus.OK)
    async markNoShow(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const appointment = await this.workflowService.markNoShow(id, user);
        return {
            message: 'Cita marcada como no-show',
            appointment,
        };
    }

    /**
     * POST /workflow/appointment/:id/cancel
     * Cancelar cita: SCHEDULED|CONFIRMED → CANCELLED
     */
    @Post('appointment/:id/cancel')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @HttpCode(HttpStatus.OK)
    async cancelAppointment(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelAppointmentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const appointment = await this.workflowService.cancelAppointment(
            id,
            dto.reason,
            user,
        );
        return {
            message: 'Cita cancelada',
            appointment,
        };
    }

    // ============================================================
    // SESSION LIFECYCLE
    // ============================================================

    /**
     * POST /workflow/appointment/:id/start-session
     * Iniciar sesión clínica desde cita CONFIRMED
     */
    @Post('appointment/:id/start-session')
    @Roles(GlobalRole.TERAPEUTA)
    @HttpCode(HttpStatus.CREATED)
    async startSession(
        @Param('id', ParseUUIDPipe) appointmentId: string,
        @Body() dto: StartSessionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const result = await this.workflowService.startSession(
            appointmentId,
            user,
            dto.initialNarrative as ClinicalNarrative | undefined,
        );

        return {
            message: 'Sesión iniciada',
            session: {
                id: result.session.id,
                startedAt: result.session.startedAt,
            },
            appointmentStatus: result.appointmentStatus,
        };
    }

    /**
     * POST /workflow/session/:id/end
     * Cerrar sesión clínica (sin firmar)
     */
    @Post('session/:id/end')
    @Roles(GlobalRole.TERAPEUTA)
    @HttpCode(HttpStatus.OK)
    async endSession(
        @Param('id', ParseUUIDPipe) sessionId: string,
        @Body() dto: EndSessionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const result = await this.workflowService.endSession(
            sessionId,
            dto.narrative as ClinicalNarrative,
            user,
        );

        return {
            message: 'Sesión cerrada',
            session: {
                id: result.session.id,
                endedAt: result.session.endedAt,
                durationMinutes: result.durationMinutes,
            },
            appointmentStatus: result.appointmentStatus,
            nextAction: 'Firmar sesión para completar',
        };
    }

    /**
     * POST /workflow/session/:id/sign
     * Firmar sesión clínica (la bloquea permanentemente)
     */
    @Post('session/:id/sign')
    @Roles(GlobalRole.TERAPEUTA)
    @HttpCode(HttpStatus.OK)
    async signSession(
        @Param('id', ParseUUIDPipe) sessionId: string,
        @Body() dto: SignSessionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        const result = await this.workflowService.signSession(
            sessionId,
            dto.signatureConfirmation,
            user,
        );

        return {
            message: 'Sesión firmada y bloqueada',
            session: {
                id: result.session.id,
                signedAt: result.session.signedAt,
                isLocked: result.isLocked,
            },
            signatureHash: result.signatureHash.substring(0, 16) + '...',
            warning: 'Esta sesión ya no puede modificarse',
        };
    }
}
