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
exports.ShadowNotesService = void 0;
const common_1 = require("@nestjs/common");
const shadow_notes_repository_1 = require("./shadow-notes.repository");
const sessions_repository_1 = require("../sessions/sessions.repository");
const crypto_service_1 = require("../../crypto/crypto.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const crypto_interfaces_1 = require("../../crypto/interfaces/crypto.interfaces");
let ShadowNotesService = class ShadowNotesService {
    constructor(shadowNotesRepo, sessionsRepo, cryptoService, auditService) {
        this.shadowNotesRepo = shadowNotesRepo;
        this.sessionsRepo = sessionsRepo;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }
    async create(dto, actor) {
        const session = await this.sessionsRepo.findById(dto.sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        if (session.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Solo el terapeuta de la sesión puede crear notas sombra');
        }
        const exists = await this.shadowNotesRepo.existsForSession(dto.sessionId);
        if (exists) {
            throw new common_1.ConflictException('Ya existe una nota sombra para esta sesión');
        }
        const { encrypted, iv } = await this.cryptoService.encryptShadowNote(dto.content, actor.id);
        const shadowNote = await this.shadowNotesRepo.create({
            session: { connect: { id: dto.sessionId } },
            therapist: { connect: { id: actor.id } },
            contentEncrypted: encrypted,
            contentIV: iv,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.SHADOW_NOTE,
            resourceId: shadowNote.id,
            patientId: session.patientId,
            success: true,
        });
        return {
            id: shadowNote.id,
            sessionId: shadowNote.sessionId,
            createdAt: shadowNote.createdAt,
        };
    }
    async findById(id, actor) {
        const note = await this.shadowNotesRepo.findById(id);
        if (!note) {
            throw new common_1.NotFoundException('Nota sombra no encontrada');
        }
        if (note.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Sin acceso a esta nota sombra');
        }
        const session = await this.sessionsRepo.findById(note.sessionId);
        let content;
        try {
            content = await this.cryptoService.decryptShadowNote(note.contentEncrypted, note.contentIV, actor.id, id);
        }
        catch (error) {
            if (error instanceof crypto_interfaces_1.DecryptionError) {
                throw new common_1.BadRequestException('Error al descifrar nota sombra');
            }
            throw error;
        }
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.DECRYPT,
            resource: client_1.AuditResource.SHADOW_NOTE,
            resourceId: id,
            patientId: session?.patientId,
            success: true,
        });
        return {
            id: note.id,
            sessionId: note.sessionId,
            content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        };
    }
    async findBySession(sessionId, actor) {
        const note = await this.shadowNotesRepo.findBySession(sessionId);
        if (!note) {
            return null;
        }
        if (note.therapistId !== actor.id) {
            return null;
        }
        return this.findById(note.id, actor);
    }
    async findMyNotes(actor) {
        const notes = await this.shadowNotesRepo.findByTherapist(actor.id);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.SHADOW_NOTE,
            resourceId: actor.id,
            success: true,
            details: { count: notes.length, type: 'list' },
        });
        return notes.map((n) => ({
            id: n.id,
            sessionId: n.sessionId,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
        }));
    }
    async update(id, dto, actor) {
        const note = await this.shadowNotesRepo.findById(id);
        if (!note) {
            throw new common_1.NotFoundException('Nota sombra no encontrada');
        }
        if (note.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Sin acceso a esta nota sombra');
        }
        const { encrypted, iv } = await this.cryptoService.encryptShadowNote(dto.content, actor.id);
        const updated = await this.shadowNotesRepo.update(id, {
            contentEncrypted: encrypted,
            contentIV: iv,
        });
        const session = await this.sessionsRepo.findById(note.sessionId);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.SHADOW_NOTE,
            resourceId: id,
            patientId: session?.patientId,
            success: true,
        });
        return {
            id: updated.id,
            sessionId: updated.sessionId,
            updatedAt: updated.updatedAt,
        };
    }
    async softDelete(id, actor) {
        const note = await this.shadowNotesRepo.findById(id);
        if (!note) {
            throw new common_1.NotFoundException('Nota sombra no encontrada');
        }
        if (note.therapistId !== actor.id) {
            throw new common_1.ForbiddenException('Sin acceso a esta nota sombra');
        }
        await this.shadowNotesRepo.softDelete(id);
        const session = await this.sessionsRepo.findById(note.sessionId);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.DELETE,
            resource: client_1.AuditResource.SHADOW_NOTE,
            resourceId: id,
            patientId: session?.patientId,
            success: true,
            details: { softDelete: true },
        });
    }
};
exports.ShadowNotesService = ShadowNotesService;
exports.ShadowNotesService = ShadowNotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shadow_notes_repository_1.ShadowNotesRepository,
        sessions_repository_1.SessionsRepository,
        crypto_service_1.CryptoService,
        audit_service_1.AuditService])
], ShadowNotesService);
//# sourceMappingURL=shadow-notes.service.js.map