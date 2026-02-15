// src/modules/workflow/clinical-workflow.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { AppointmentStatus, AuditAction, AuditResource } from '@prisma/client';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { AppointmentStateMachine } from './appointment-state-machine';
import {
    StateTransitionError,
    WorkflowEvent,
    WorkflowEventType,
} from './interfaces/workflow.interfaces';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ClinicalNarrative } from '../../crypto/interfaces/crypto.interfaces';

/**
 * ClinicalWorkflowService
 * 
 * Orquesta el flujo completo entre Appointments y ClinicalSessions.
 * Garantiza la integridad del workflow clínico.
 * 
 * Flujo Normal:
 * 1. Appointment SCHEDULED
 * 2. Appointment CONFIRMED (paciente confirma)
 * 3. Terapeuta inicia sesión → Appointment IN_PROGRESS
 * 4. Terapeuta documenta y cierra sesión → Appointment COMPLETED
 * 5. Terapeuta firma sesión → Session LOCKED
 */
@Injectable()
export class ClinicalWorkflowService {
    private readonly logger = new Logger(ClinicalWorkflowService.name);

    constructor(
        private readonly appointmentsRepo: AppointmentsRepository,
        private readonly sessionsRepo: SessionsRepository,
        private readonly cryptoService: CryptoService,
        private readonly auditService: AuditService,
        private readonly stateMachine: AppointmentStateMachine,
    ) { }

    // ============================================================
    // APPOINTMENT LIFECYCLE
    // ============================================================

    /**
     * Confirmar cita
     * SCHEDULED → CONFIRMED
     */
    async confirmAppointment(appointmentId: string, actor: AuthenticatedUser) {
        const appointment = await this.getAppointmentOrFail(appointmentId);

        // Validar transición
        this.stateMachine.validateTransition(
            appointment.status,
            AppointmentStatus.CONFIRMED,
            appointmentId,
        );

        const updated = await this.appointmentsRepo.update(appointmentId, {
            status: AppointmentStatus.CONFIRMED,
            confirmedAt: new Date(),
        });

        // Auditar cambio de estado
        await this.auditStateChange(
            'APPOINTMENT',
            appointmentId,
            appointment.status,
            AppointmentStatus.CONFIRMED,
            actor,
            appointment.patientId,
        );

        // Emitir evento de workflow
        this.emitWorkflowEvent({
            eventType: WorkflowEventType.APPOINTMENT_CONFIRMED,
            resourceType: 'APPOINTMENT',
            resourceId: appointmentId,
            fromState: appointment.status,
            toState: AppointmentStatus.CONFIRMED,
            actorId: actor.id,
            timestamp: new Date(),
        });

        return updated;
    }

    /**
     * Marcar como no-show
     * SCHEDULED → NO_SHOW
     */
    async markNoShow(appointmentId: string, actor: AuthenticatedUser) {
        const appointment = await this.getAppointmentOrFail(appointmentId);

        this.stateMachine.validateTransition(
            appointment.status,
            AppointmentStatus.NO_SHOW,
            appointmentId,
        );

        const updated = await this.appointmentsRepo.update(appointmentId, {
            status: AppointmentStatus.NO_SHOW,
        });

        await this.auditStateChange(
            'APPOINTMENT',
            appointmentId,
            appointment.status,
            AppointmentStatus.NO_SHOW,
            actor,
            appointment.patientId,
        );

        this.emitWorkflowEvent({
            eventType: WorkflowEventType.APPOINTMENT_NO_SHOW,
            resourceType: 'APPOINTMENT',
            resourceId: appointmentId,
            fromState: appointment.status,
            toState: AppointmentStatus.NO_SHOW,
            actorId: actor.id,
            timestamp: new Date(),
        });

        return updated;
    }

    /**
     * Cancelar cita
     * SCHEDULED|CONFIRMED → CANCELLED
     */
    async cancelAppointment(
        appointmentId: string,
        reason: string,
        actor: AuthenticatedUser,
    ) {
        const appointment = await this.getAppointmentOrFail(appointmentId);

        this.stateMachine.validateTransition(
            appointment.status,
            AppointmentStatus.CANCELLED,
            appointmentId,
        );

        const updated = await this.appointmentsRepo.update(appointmentId, {
            status: AppointmentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: reason,
        });

        await this.auditStateChange(
            'APPOINTMENT',
            appointmentId,
            appointment.status,
            AppointmentStatus.CANCELLED,
            actor,
            appointment.patientId,
            { cancelReason: reason },
        );

        this.emitWorkflowEvent({
            eventType: WorkflowEventType.APPOINTMENT_CANCELLED,
            resourceType: 'APPOINTMENT',
            resourceId: appointmentId,
            fromState: appointment.status,
            toState: AppointmentStatus.CANCELLED,
            actorId: actor.id,
            timestamp: new Date(),
            metadata: { reason },
        });

        return updated;
    }

    // ============================================================
    // SESSION LIFECYCLE
    // ============================================================

    /**
     * Iniciar sesión clínica
     * 
     * Pre-condiciones:
     * - Cita debe estar CONFIRMED
     * - No debe existir sesión para esa cita
     * 
     * Post-condiciones:
     * - Crea ClinicalSession con startedAt = now()
     * - Appointment pasa a IN_PROGRESS
     */
    async startSession(
        appointmentId: string,
        actor: AuthenticatedUser,
        initialNarrative?: ClinicalNarrative,
    ) {
        const appointment = await this.getAppointmentOrFail(appointmentId);

        // Validar que la cita permite iniciar sesión
        if (!this.stateMachine.canCreateSession(appointment.status)) {
            throw new BadRequestException(
                `No se puede iniciar sesión desde estado: ${this.stateMachine.getStateDescription(appointment.status)}. ` +
                `La cita debe estar CONFIRMADA.`,
            );
        }

        // Verificar que no existe sesión
        const existingSession = await this.sessionsRepo.findByAppointment(appointmentId);
        if (existingSession) {
            throw new BadRequestException('Ya existe una sesión para esta cita');
        }

        // Timestamp de inicio
        const startedAt = new Date();

        // Cifrar narrativa inicial si existe
        let encryptedPayload: { encrypted: Buffer; iv: Buffer; keyId: string } | null = null;
        if (initialNarrative) {
            encryptedPayload = await this.cryptoService.encryptClinicalNarrative(initialNarrative);
        }

        // Crear sesión
        const session = await this.sessionsRepo.create({
            appointment: { connect: { id: appointmentId } },
            patient: { connect: { id: appointment.patientId } },
            therapist: { connect: { id: actor.id } },
            startedAt,
            clinicalNarrativeEncrypted: encryptedPayload?.encrypted,
            narrativeIV: encryptedPayload?.iv,
            narrativeKeyId: encryptedPayload?.keyId,
            isDraft: true,
            isLocked: false,
        });

        // Transición de cita a IN_PROGRESS
        await this.appointmentsRepo.update(appointmentId, {
            status: AppointmentStatus.IN_PROGRESS,
        });

        // Auditar inicio de sesión
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: session.id,
            patientId: appointment.patientId,
            success: true,
            details: { appointmentId, startedAt: startedAt.toISOString() },
        });

        // Auditar cambio de estado de cita
        await this.auditStateChange(
            'APPOINTMENT',
            appointmentId,
            appointment.status,
            AppointmentStatus.IN_PROGRESS,
            actor,
            appointment.patientId,
            { sessionId: session.id },
        );

        this.emitWorkflowEvent({
            eventType: WorkflowEventType.SESSION_STARTED,
            resourceType: 'SESSION',
            resourceId: session.id,
            actorId: actor.id,
            timestamp: startedAt,
            metadata: { appointmentId },
        });

        this.logger.log(
            `Session started: ${session.id} for appointment ${appointmentId}`,
        );

        return {
            session,
            appointmentStatus: AppointmentStatus.IN_PROGRESS,
        };
    }

    /**
     * Cerrar sesión clínica (sin firmar)
     * 
     * Pre-condiciones:
     * - Sesión debe existir y estar en draft
     * - Debe tener narrativa clínica
     * 
     * Post-condiciones:
     * - endedAt y durationMinutes se calculan
     * - Appointment pasa a COMPLETED
     * - Sesión lista para firmar
     */
    async endSession(
        sessionId: string,
        narrative: ClinicalNarrative,
        actor: AuthenticatedUser,
    ) {
        const session = await this.getSessionOrFail(sessionId);

        // Validar que el terapeuta es el dueño
        if (session.therapistId !== actor.id) {
            throw new ForbiddenException('Solo el terapeuta de la sesión puede cerrarla');
        }

        // Validar que no está firmada
        if (session.isLocked || session.signedAt) {
            throw new BadRequestException('La sesión ya está firmada');
        }

        const endedAt = new Date();
        const durationMinutes = Math.round(
            (endedAt.getTime() - session.startedAt.getTime()) / 60000,
        );

        // Cifrar narrativa final
        const encryptedPayload = await this.cryptoService.encryptClinicalNarrative(narrative);

        // Actualizar sesión
        const updatedSession = await this.sessionsRepo.update(sessionId, {
            endedAt,
            durationMinutes,
            clinicalNarrativeEncrypted: encryptedPayload.encrypted,
            narrativeIV: encryptedPayload.iv,
            narrativeKeyId: encryptedPayload.keyId,
            isDraft: false, // Ya no es borrador
        });

        // Transición de cita a COMPLETED
        const appointment = await this.appointmentsRepo.findById(session.appointmentId);
        if (appointment) {
            await this.appointmentsRepo.update(session.appointmentId, {
                status: AppointmentStatus.COMPLETED,
            });

            await this.auditStateChange(
                'APPOINTMENT',
                session.appointmentId,
                AppointmentStatus.IN_PROGRESS,
                AppointmentStatus.COMPLETED,
                actor,
                session.patientId,
                { sessionId },
            );
        }

        // Auditar cierre de sesión
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: sessionId,
            patientId: session.patientId,
            success: true,
            details: {
                action: 'end',
                endedAt: endedAt.toISOString(),
                durationMinutes,
            },
        });

        this.emitWorkflowEvent({
            eventType: WorkflowEventType.SESSION_ENDED,
            resourceType: 'SESSION',
            resourceId: sessionId,
            actorId: actor.id,
            timestamp: endedAt,
            metadata: { durationMinutes },
        });

        this.logger.log(`Session ended: ${sessionId}, duration: ${durationMinutes} min`);

        return {
            session: updatedSession,
            durationMinutes,
            appointmentStatus: AppointmentStatus.COMPLETED,
        };
    }

    /**
     * Firmar sesión clínica
     * 
     * Pre-condiciones:
     * - Sesión debe estar cerrada (endedAt != null)
     * - Debe tener narrativa completa
     * 
     * Post-condiciones:
     * - isLocked = true
     * - signedAt = now()
     * - signatureHash generado
     * - LA SESIÓN ES INMUTABLE
     */
    async signSession(
        sessionId: string,
        signatureConfirmation: string,
        actor: AuthenticatedUser,
    ) {
        const session = await this.getSessionOrFail(sessionId);

        // Validar ownership
        if (session.therapistId !== actor.id) {
            throw new ForbiddenException('Solo el terapeuta de la sesión puede firmarla');
        }

        // Validar que tiene narrativa
        if (!session.clinicalNarrativeEncrypted) {
            throw new BadRequestException('La sesión debe tener narrativa clínica');
        }

        // Validar que ya fue cerrada
        if (!session.endedAt) {
            throw new BadRequestException('La sesión debe estar cerrada antes de firmar');
        }

        // Validar que no está ya firmada
        if (session.isLocked || session.signedAt) {
            throw new BadRequestException('La sesión ya está firmada');
        }

        const signedAt = new Date();

        // Generar hash de firma
        const signatureHash = this.cryptoService.generateSessionSignature(
            sessionId,
            actor.id,
            signedAt,
        );

        // Bloquear sesión
        const signedSession = await this.sessionsRepo.update(sessionId, {
            signedAt,
            signatureHash,
            isLocked: true,
            isDraft: false,
        });

        // Auditar firma
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: sessionId,
            patientId: session.patientId,
            success: true,
            details: {
                action: 'sign',
                signedAt: signedAt.toISOString(),
                signatureHash: signatureHash.substring(0, 16) + '...',
                confirmation: signatureConfirmation.substring(0, 20) + '...',
            },
        });

        this.emitWorkflowEvent({
            eventType: WorkflowEventType.SESSION_SIGNED,
            resourceType: 'SESSION',
            resourceId: sessionId,
            actorId: actor.id,
            timestamp: signedAt,
        });

        this.logger.warn(`Session SIGNED and LOCKED: ${sessionId}`);

        return {
            session: signedSession,
            signatureHash,
            isLocked: true,
        };
    }

    // ============================================================
    // WORKFLOW QUERIES
    // ============================================================

    /**
     * Obtener estado actual del workflow para una cita
     */
    async getWorkflowStatus(appointmentId: string) {
        const appointment = await this.getAppointmentOrFail(appointmentId);
        const session = await this.sessionsRepo.findByAppointment(appointmentId);

        return {
            appointment: {
                id: appointment.id,
                status: appointment.status,
                statusDescription: this.stateMachine.getStateDescription(appointment.status),
                isFinal: this.stateMachine.isFinal(appointment.status),
                availableTransitions: this.stateMachine.getAvailableTransitions(appointment.status),
                canCreateSession: this.stateMachine.canCreateSession(appointment.status),
            },
            session: session
                ? {
                    id: session.id,
                    startedAt: session.startedAt,
                    endedAt: session.endedAt,
                    durationMinutes: session.durationMinutes,
                    isDraft: session.isDraft,
                    isLocked: session.isLocked,
                    isSigned: !!session.signedAt,
                }
                : null,
            workflow: {
                stage: this.determineWorkflowStage(appointment.status, session),
                nextAction: this.determineNextAction(appointment.status, session),
            },
        };
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private async getAppointmentOrFail(id: string) {
        const appointment = await this.appointmentsRepo.findById(id);
        if (!appointment) {
            throw new NotFoundException(`Cita no encontrada: ${id}`);
        }
        return appointment;
    }

    private async getSessionOrFail(id: string) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new NotFoundException(`Sesión no encontrada: ${id}`);
        }
        return session;
    }

    private async auditStateChange(
        resourceType: 'APPOINTMENT' | 'SESSION',
        resourceId: string,
        fromState: string,
        toState: string,
        actor: AuthenticatedUser,
        patientId: string,
        metadata?: Record<string, any>,
    ) {
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource:
                resourceType === 'APPOINTMENT'
                    ? AuditResource.APPOINTMENT
                    : AuditResource.CLINICAL_SESSION,
            resourceId,
            patientId,
            success: true,
            details: {
                stateChange: true,
                fromState,
                toState,
                ...metadata,
            },
        });
    }

    private emitWorkflowEvent(event: WorkflowEvent) {
        // En una implementación real, esto emitiría a un event bus
        // Por ahora solo logueamos
        this.logger.debug(
            `Workflow event: ${event.eventType} - ${event.resourceType}:${event.resourceId}`,
        );
    }

    private determineWorkflowStage(
        appointmentStatus: AppointmentStatus,
        session: any,
    ): string {
        if (!session) {
            switch (appointmentStatus) {
                case AppointmentStatus.SCHEDULED:
                    return 'AWAITING_CONFIRMATION';
                case AppointmentStatus.CONFIRMED:
                    return 'READY_TO_START';
                case AppointmentStatus.CANCELLED:
                    return 'CANCELLED';
                case AppointmentStatus.NO_SHOW:
                    return 'NO_SHOW';
                default:
                    return 'UNKNOWN';
            }
        }

        if (session.isLocked) {
            return 'COMPLETED_AND_SIGNED';
        }

        if (session.endedAt) {
            return 'AWAITING_SIGNATURE';
        }

        return 'SESSION_IN_PROGRESS';
    }

    private determineNextAction(
        appointmentStatus: AppointmentStatus,
        session: any,
    ): string | null {
        if (!session) {
            switch (appointmentStatus) {
                case AppointmentStatus.SCHEDULED:
                    return 'Confirmar cita';
                case AppointmentStatus.CONFIRMED:
                    return 'Iniciar sesión';
                default:
                    return null;
            }
        }

        if (session.isLocked) {
            return null; // Workflow completado
        }

        if (session.endedAt) {
            return 'Firmar sesión';
        }

        return 'Documentar y cerrar sesión';
    }
}
