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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsService = void 0;
const common_1 = require("@nestjs/common");
const sessions_repository_1 = require("./sessions.repository");
const appointments_repository_1 = require("../appointments/appointments.repository");
const crypto_service_1 = require("../../crypto/crypto.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const crypto_interfaces_1 = require("../../crypto/interfaces/crypto.interfaces");
let SessionsService = class SessionsService {
    constructor(sessionsRepo, appointmentsRepo, cryptoService, auditService) {
        this.sessionsRepo = sessionsRepo;
        this.appointmentsRepo = appointmentsRepo;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }
    async create(dto, actor) {
        const appointment = await this.appointmentsRepo.findById(dto.appointmentId);
        if (!appointment) {
            throw new common_1.NotFoundException('Cita no encontrada');
        }
        const existingSession = await this.sessionsRepo.findByAppointment(dto.appointmentId);
        if (existingSession) {
            throw new common_1.ConflictException('Ya existe una sesión para esta cita');
        }
        let encryptedPayload = null;
        if (dto.clinicalNarrative) {
            encryptedPayload = await this.cryptoService.encryptClinicalNarrative(dto.clinicalNarrative);
        }
        await this.appointmentsRepo.update(dto.appointmentId, {
            status: client_1.AppointmentStatus.IN_PROGRESS,
        });
        const session = await this.sessionsRepo.create({
            appointment: { connect: { id: dto.appointmentId } },
            patient: { connect: { id: appointment.patientId } },
            therapist: { connect: { id: actor.id } },
            startedAt: new Date(dto.startedAt),
            clinicalNarrativeEncrypted: encryptedPayload?.encrypted,
            narrativeIV: encryptedPayload?.iv,
            narrativeKeyId: encryptedPayload?.keyId,
            isDraft: true,
            isLocked: false,
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
        });
        return this.sanitizeSession(session);
    }
    async findById(id, actor) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
        });
        const decryptedNarrative = await this.safeDecryptNarrative(session, actor.id);
        if (decryptedNarrative) {
            await this.auditService.log({
                actorId: actor.id,
                actorRole: actor.globalRole,
                actorIp: actor.ip,
                action: client_1.AuditAction.DECRYPT,
                resource: client_1.AuditResource.CLINICAL_SESSION,
                resourceId: id,
                patientId: session.patientId,
                success: true,
            });
        }
        return {
            ...this.sanitizeSession(session),
            clinicalNarrative: decryptedNarrative,
        };
    }
    async findByTherapist(actor, isDraft) {
        const sessions = await this.sessionsRepo.findByTherapist(actor.id, {
            isDraft,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: actor.id,
            success: true,
            details: { count: sessions.length, type: 'list', isDraft },
        });
        return sessions.map((s) => this.sanitizeSession(s));
    }
    async findByPatient(patientId, actor) {
        const sessions = await this.sessionsRepo.findByPatient(patientId);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: patientId,
            patientId,
            success: true,
            details: { count: sessions.length, type: 'patientHistory' },
        });
        return sessions.map((s) => this.sanitizeSession(s));
    }
    async update(id, dto, actor) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        if (session.isLocked || session.signedAt) {
            throw new common_1.ForbiddenException('Las sesiones firmadas no pueden editarse');
        }
        if (session.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Solo el terapeuta de la sesión puede editarla');
        }
        if (session.clinicalNarrativeEncrypted && session.narrativeIV) {
            const versionCount = await this.sessionsRepo.getVersionCount(id);
            await this.sessionsRepo.createVersion({
                sessionId: id,
                versionNumber: versionCount + 1,
                narrativeSnapshotEncrypted: session.clinicalNarrativeEncrypted,
                narrativeIV: session.narrativeIV,
                narrativeKeyId: session.narrativeKeyId,
                changedBy: actor.id,
                changeReason: dto.changeReason,
            });
        }
        let encryptedPayload = null;
        if (dto.clinicalNarrative) {
            encryptedPayload = await this.cryptoService.encryptClinicalNarrative(dto.clinicalNarrative);
        }
        const updated = await this.sessionsRepo.update(id, {
            endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
            durationMinutes: dto.endedAt
                ? this.calculateDuration(session.startedAt, new Date(dto.endedAt))
                : undefined,
            clinicalNarrativeEncrypted: encryptedPayload?.encrypted,
            narrativeIV: encryptedPayload?.iv,
            narrativeKeyId: encryptedPayload?.keyId,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: { changeReason: dto.changeReason, newKeyId: encryptedPayload?.keyId },
        });
        return this.sanitizeSession(updated);
    }
    async sign(id, dto, actor) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        if (session.isLocked || session.signedAt) {
            throw new common_1.ConflictException('La sesión ya está firmada');
        }
        if (session.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Solo el terapeuta de la sesión puede firmarla');
        }
        if (session.isDraft && !session.clinicalNarrativeEncrypted) {
            throw new common_1.BadRequestException('No se puede firmar una sesión sin narrativa clínica');
        }
        const signatureHash = this.cryptoService.generateSessionSignature(id, actor.id, new Date());
        await this.appointmentsRepo.update(session.appointmentId, {
            status: client_1.AppointmentStatus.COMPLETED,
        });
        const signed = await this.sessionsRepo.sign(id, signatureHash);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: {
                action: 'sign',
                signatureHash: signatureHash.substring(0, 16) + '...',
            },
        });
        return this.sanitizeSession(signed);
    }
    async getVersions(id, actor) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        const versions = await this.sessionsRepo.getVersions(id);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: { type: 'versions', count: versions.length },
        });
        return versions.map((v) => ({
            id: v.id,
            versionNumber: v.versionNumber,
            createdAt: v.createdAt,
            changeReason: v.changeReason,
        }));
    }
    async reEncryptSession(id, actor) {
        const session = await this.sessionsRepo.findById(id);
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        if (!session.clinicalNarrativeEncrypted || !session.narrativeIV) {
            throw new common_1.BadRequestException('La sesión no tiene narrativa cifrada');
        }
        const newPayload = await this.cryptoService.reEncryptClinicalNarrative({
            encrypted: session.clinicalNarrativeEncrypted,
            iv: session.narrativeIV,
            keyId: session.narrativeKeyId,
        }, id, actor.id);
        await this.sessionsRepo.update(id, {
            clinicalNarrativeEncrypted: newPayload.encrypted,
            narrativeIV: newPayload.iv,
            narrativeKeyId: newPayload.keyId,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: {
                action: 'reEncrypt',
                oldKeyId: session.narrativeKeyId,
                newKeyId: newPayload.keyId,
            },
        });
        return { success: true, newKeyId: newPayload.keyId };
    }
    async safeDecryptNarrative(session, actorId) {
        if (!session.clinicalNarrativeEncrypted ||
            !session.narrativeIV ||
            !session.narrativeKeyId) {
            return null;
        }
        try {
            return await this.cryptoService.decryptClinicalNarrative({
                encrypted: session.clinicalNarrativeEncrypted,
                iv: session.narrativeIV,
                keyId: session.narrativeKeyId,
            }, session.id, actorId);
        }
        catch (error) {
            if (error instanceof crypto_interfaces_1.DecryptionError) {
                throw new common_1.BadRequestException(`Error al descifrar narrativa: ${error.reason}`);
            }
            throw error;
        }
    }
    sanitizeSession(session) {
        const { clinicalNarrativeEncrypted, narrativeIV, narrativeKeyId, ...safe } = session;
        return safe;
    }
    calculateDuration(start, end) {
        return Math.round((end.getTime() - start.getTime()) / 60000);
    }
};
exports.SessionsService = SessionsService;
exports.SessionsService = SessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sessions_repository_1.SessionsRepository,
        appointments_repository_1.AppointmentsRepository,
        crypto_service_1.CryptoService,
        audit_service_1.AuditService])
], SessionsService);
//# sourceMappingURL=sessions.service.js.map