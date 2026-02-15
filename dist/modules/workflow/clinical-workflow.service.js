"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClinicalWorkflowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalWorkflowService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const appointments_repository_1 = require("../appointments/appointments.repository");
const sessions_repository_1 = require("../sessions/sessions.repository");
const crypto_service_1 = require("../../crypto/crypto.service");
const audit_service_1 = require("../audit/audit.service");
const appointment_state_machine_1 = require("./appointment-state-machine");
const workflow_interfaces_1 = require("./interfaces/workflow.interfaces");
let ClinicalWorkflowService = ClinicalWorkflowService_1 = class ClinicalWorkflowService {
    constructor(appointmentsRepo, sessionsRepo, cryptoService, auditService, stateMachine) {
        this.appointmentsRepo = appointmentsRepo;
        this.sessionsRepo = sessionsRepo;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
        this.stateMachine = stateMachine;
        this.logger = new common_1.Logger(ClinicalWorkflowService_1.name);
    }
    async confirmAppointment(appointmentId, actor) {
        const appointment = await this.getAppointmentOrFail(appointmentId);
        this.stateMachine.validateTransition(appointment.status, client_1.AppointmentStatus.CONFIRMED, appointmentId);
        const updated = await this.appointmentsRepo.update(appointmentId, {
            status: client_1.AppointmentStatus.CONFIRMED,
            confirmedAt: new Date(),
        });
        await this.auditStateChange('APPOINTMENT', appointmentId, appointment.status, client_1.AppointmentStatus.CONFIRMED, actor, appointment.patientId);
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.APPOINTMENT_CONFIRMED,
            resourceType: 'APPOINTMENT',
            resourceId: appointmentId,
            fromState: appointment.status,
            toState: client_1.AppointmentStatus.CONFIRMED,
            actorId: actor.id,
            timestamp: new Date(),
        });
        return updated;
    }
    async markNoShow(appointmentId, actor) {
        const appointment = await this.getAppointmentOrFail(appointmentId);
        this.stateMachine.validateTransition(appointment.status, client_1.AppointmentStatus.NO_SHOW, appointmentId);
        const updated = await this.appointmentsRepo.update(appointmentId, {
            status: client_1.AppointmentStatus.NO_SHOW,
        });
        await this.auditStateChange('APPOINTMENT', appointmentId, appointment.status, client_1.AppointmentStatus.NO_SHOW, actor, appointment.patientId);
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.APPOINTMENT_NO_SHOW,
            resourceType: 'APPOINTMENT',
            resourceId: appointmentId,
            fromState: appointment.status,
            toState: client_1.AppointmentStatus.NO_SHOW,
            actorId: actor.id,
            timestamp: new Date(),
        });
        return updated;
    }
    async cancelAppointment(appointmentId, reason, actor) {
        const appointment = await this.getAppointmentOrFail(appointmentId);
        this.stateMachine.validateTransition(appointment.status, client_1.AppointmentStatus.CANCELLED, appointmentId);
        const updated = await this.appointmentsRepo.update(appointmentId, {
            status: client_1.AppointmentStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: reason,
        });
        await this.auditStateChange('APPOINTMENT', appointmentId, appointment.status, client_1.AppointmentStatus.CANCELLED, actor, appointment.patientId, { cancelReason: reason });
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.APPOINTMENT_CANCELLED,
            resourceType: 'APPOINTMENT',
            resourceId: appointmentId,
            fromState: appointment.status,
            toState: client_1.AppointmentStatus.CANCELLED,
            actorId: actor.id,
            timestamp: new Date(),
            metadata: { reason },
        });
        return updated;
    }
    async startSession(appointmentId, actor, initialNarrative) {
        const appointment = await this.getAppointmentOrFail(appointmentId);
        if (!this.stateMachine.canCreateSession(appointment.status)) {
            throw new common_1.BadRequestException(`No se puede iniciar sesión desde estado: ${this.stateMachine.getStateDescription(appointment.status)}. ` +
                `La cita debe estar CONFIRMADA.`);
        }
        const existingSession = await this.sessionsRepo.findByAppointment(appointmentId);
        if (existingSession) {
            throw new common_1.BadRequestException('Ya existe una sesión para esta cita');
        }
        const startedAt = new Date();
        let encryptedPayload = null;
        if (initialNarrative) {
            encryptedPayload = await this.cryptoService.encryptClinicalNarrative(initialNarrative);
        }
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
        await this.appointmentsRepo.update(appointmentId, {
            status: client_1.AppointmentStatus.IN_PROGRESS,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: session.id,
            patientId: appointment.patientId,
            success: true,
            details: { appointmentId, startedAt: startedAt.toISOString() },
        });
        await this.auditStateChange('APPOINTMENT', appointmentId, appointment.status, client_1.AppointmentStatus.IN_PROGRESS, actor, appointment.patientId, { sessionId: session.id });
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.SESSION_STARTED,
            resourceType: 'SESSION',
            resourceId: session.id,
            actorId: actor.id,
            timestamp: startedAt,
            metadata: { appointmentId },
        });
        this.logger.log(`Session started: ${session.id} for appointment ${appointmentId}`);
        return {
            session,
            appointmentStatus: client_1.AppointmentStatus.IN_PROGRESS,
        };
    }
    async endSession(sessionId, narrative, actor) {
        const session = await this.getSessionOrFail(sessionId);
        if (session.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Solo el terapeuta de la sesión puede cerrarla');
        }
        if (session.isLocked || session.signedAt) {
            throw new common_1.BadRequestException('La sesión ya está firmada');
        }
        const endedAt = new Date();
        const durationMinutes = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000);
        const encryptedPayload = await this.cryptoService.encryptClinicalNarrative(narrative);
        const updatedSession = await this.sessionsRepo.update(sessionId, {
            endedAt,
            durationMinutes,
            clinicalNarrativeEncrypted: encryptedPayload.encrypted,
            narrativeIV: encryptedPayload.iv,
            narrativeKeyId: encryptedPayload.keyId,
            isDraft: false,
        });
        const appointment = await this.appointmentsRepo.findById(session.appointmentId);
        if (appointment) {
            await this.appointmentsRepo.update(session.appointmentId, {
                status: client_1.AppointmentStatus.COMPLETED,
            });
            await this.auditStateChange('APPOINTMENT', session.appointmentId, client_1.AppointmentStatus.IN_PROGRESS, client_1.AppointmentStatus.COMPLETED, actor, session.patientId, { sessionId });
        }
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
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
            eventType: workflow_interfaces_1.WorkflowEventType.SESSION_ENDED,
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
            appointmentStatus: client_1.AppointmentStatus.COMPLETED,
        };
    }
    async signSession(sessionId, signatureConfirmation, actor) {
        const session = await this.getSessionOrFail(sessionId);
        if (session.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Solo el terapeuta de la sesión puede firmarla');
        }
        if (!session.clinicalNarrativeEncrypted) {
            throw new common_1.BadRequestException('La sesión debe tener narrativa clínica');
        }
        if (!session.endedAt) {
            throw new common_1.BadRequestException('La sesión debe estar cerrada antes de firmar');
        }
        if (session.isLocked || session.signedAt) {
            throw new common_1.BadRequestException('La sesión ya está firmada');
        }
        const signedAt = new Date();
        const signatureHash = this.cryptoService.generateSessionSignature(sessionId, actor.id, signedAt);
        const signedSession = await this.sessionsRepo.update(sessionId, {
            signedAt,
            signatureHash,
            isLocked: true,
            isDraft: false,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
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
            eventType: workflow_interfaces_1.WorkflowEventType.SESSION_SIGNED,
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
    async getWorkflowStatus(appointmentId) {
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
    async getAppointmentOrFail(id) {
        const appointment = await this.appointmentsRepo.findById(id);
        if (!appointment) {
            throw new common_1.NotFoundException(`Cita no encontrada: ${id}`);
        }
        return appointment;
    }
    async getSessionOrFail(id) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new common_1.NotFoundException(`Sesión no encontrada: ${id}`);
        }
        return session;
    }
    async auditStateChange(resourceType, resourceId, fromState, toState, actor, patientId, metadata) {
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: resourceType === 'APPOINTMENT'
                ? client_1.AuditResource.APPOINTMENT
                : client_1.AuditResource.CLINICAL_SESSION,
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
    emitWorkflowEvent(event) {
        this.logger.debug(`Workflow event: ${event.eventType} - ${event.resourceType}:${event.resourceId}`);
    }
    determineWorkflowStage(appointmentStatus, session) {
        if (!session) {
            switch (appointmentStatus) {
                case client_1.AppointmentStatus.SCHEDULED:
                    return 'AWAITING_CONFIRMATION';
                case client_1.AppointmentStatus.CONFIRMED:
                    return 'READY_TO_START';
                case client_1.AppointmentStatus.CANCELLED:
                    return 'CANCELLED';
                case client_1.AppointmentStatus.NO_SHOW:
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
    determineNextAction(appointmentStatus, session) {
        if (!session) {
            switch (appointmentStatus) {
                case client_1.AppointmentStatus.SCHEDULED:
                    return 'Confirmar cita';
                case client_1.AppointmentStatus.CONFIRMED:
                    return 'Iniciar sesión';
                default:
                    return null;
            }
        }
        if (session.isLocked) {
            return null;
        }
        if (session.endedAt) {
            return 'Firmar sesión';
        }
        return 'Documentar y cerrar sesión';
    }
};
exports.ClinicalWorkflowService = ClinicalWorkflowService;
exports.ClinicalWorkflowService = ClinicalWorkflowService = ClinicalWorkflowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [appointments_repository_1.AppointmentsRepository,
        sessions_repository_1.SessionsRepository,
        crypto_service_1.CryptoService,
        audit_service_1.AuditService,
        appointment_state_machine_1.AppointmentStateMachine])
], ClinicalWorkflowService);
//# sourceMappingURL=clinical-workflow.service.js.map