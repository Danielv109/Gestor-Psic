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
var AmendmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmendmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_service_1 = require("../../crypto/crypto.service");
const audit_service_1 = require("../audit/audit.service");
const amendment_interfaces_1 = require("./interfaces/amendment.interfaces");
const workflow_interfaces_1 = require("./interfaces/workflow.interfaces");
const client_1 = require("@prisma/client");
let AmendmentService = AmendmentService_1 = class AmendmentService {
    constructor(prisma, cryptoService, auditService) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(AmendmentService_1.name);
    }
    async createAddendum(sessionId, dto, actor) {
        const session = await this.getSessionOrFail(sessionId);
        if (!this.canAmend(session.legalStatus)) {
            throw new common_1.BadRequestException(`No se puede enmendar una sesión en estado: ${session.legalStatus}. ` +
                `Solo sesiones SIGNED o AMENDED pueden ser enmendadas.`);
        }
        this.validateAmendmentAuthorization(session, actor);
        const lastAddendum = await this.prisma.sessionAddendum.findFirst({
            where: { sessionId },
            orderBy: { sequenceNumber: 'desc' },
        });
        const sequenceNumber = (lastAddendum?.sequenceNumber || 0) + 1;
        const contentJson = JSON.stringify(dto.content);
        const encrypted = await this.cryptoService.encryptClinicalNarrative({
            subjectiveReport: contentJson,
            objectiveObservation: '',
            assessment: '',
            plan: '',
        });
        const addendum = await this.prisma.sessionAddendum.create({
            data: {
                sessionId,
                sequenceNumber,
                contentEncrypted: encrypted.encrypted,
                contentIV: encrypted.iv,
                contentKeyId: encrypted.keyId,
                reason: dto.reason,
                authorId: actor.id,
                isLocked: false,
            },
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: sessionId,
            patientId: session.patientId,
            success: true,
            details: {
                addendumId: addendum.id,
                sequenceNumber,
                reason: dto.reason,
                action: 'create_addendum',
            },
        });
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.SESSION_AMENDED,
            resourceType: 'SESSION',
            resourceId: sessionId,
            actorId: actor.id,
            timestamp: new Date(),
            metadata: { addendumId: addendum.id, sequenceNumber },
        });
        this.logger.log(`Addendum created for session ${sessionId}: #${sequenceNumber}`);
        return {
            sessionId,
            addendumId: addendum.id,
            newLegalStatus: session.legalStatus,
            sequenceNumber,
        };
    }
    async signAddendum(addendumId, dto, actor) {
        const addendum = await this.prisma.sessionAddendum.findUnique({
            where: { id: addendumId },
            include: { session: true },
        });
        if (!addendum) {
            throw new common_1.NotFoundException(`Addendum no encontrado: ${addendumId}`);
        }
        if (addendum.isLocked || addendum.signedAt) {
            throw new common_1.BadRequestException('El addendum ya está firmado');
        }
        if (addendum.authorId !== actor.id) {
            throw new common_1.ForbiddenException('Solo el autor puede firmar el addendum');
        }
        const signedAt = new Date();
        const signatureHash = this.cryptoService.generateSessionSignature(addendumId, actor.id, signedAt);
        await this.prisma.sessionAddendum.update({
            where: { id: addendumId },
            data: {
                signedAt,
                signatureHash,
                isLocked: true,
            },
        });
        await this.prisma.clinicalSession.update({
            where: { id: addendum.sessionId },
            data: {
                legalStatus: client_1.SessionLegalStatus.AMENDED,
                amendedAt: signedAt,
                amendReason: addendum.reason,
                amendedBy: actor.id,
            },
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: addendum.sessionId,
            patientId: addendum.session.patientId,
            success: true,
            details: {
                addendumId,
                signatureHash: signatureHash.substring(0, 16) + '...',
                action: 'sign_addendum',
            },
        });
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.AMENDMENT_SIGNED,
            resourceType: 'SESSION',
            resourceId: addendum.sessionId,
            actorId: actor.id,
            timestamp: signedAt,
            metadata: { addendumId },
        });
        this.logger.warn(`Addendum SIGNED: ${addendumId} for session ${addendum.sessionId}`);
        return {
            sessionId: addendum.sessionId,
            addendumId,
            newLegalStatus: client_1.SessionLegalStatus.AMENDED,
            signatureHash,
        };
    }
    async voidSession(sessionId, dto, actor) {
        const session = await this.getSessionOrFail(sessionId);
        if (!this.canVoid(session.legalStatus)) {
            throw new common_1.BadRequestException(`No se puede anular una sesión en estado: ${session.legalStatus}. ` +
                `Solo sesiones SIGNED o AMENDED pueden ser anuladas.`);
        }
        if (actor.globalRole !== client_1.GlobalRole.SUPERVISOR) {
            throw new common_1.ForbiddenException('Solo supervisores pueden anular sesiones');
        }
        const voidedAt = new Date();
        await this.prisma.clinicalSession.update({
            where: { id: sessionId },
            data: {
                legalStatus: client_1.SessionLegalStatus.VOIDED,
                voidedAt,
                voidReason: `${dto.reason}: ${dto.justification}`,
                voidedBy: actor.id,
            },
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
                reason: dto.reason,
                justification: dto.justification,
                previousStatus: session.legalStatus,
                action: 'void_session',
            },
        });
        this.emitWorkflowEvent({
            eventType: workflow_interfaces_1.WorkflowEventType.SESSION_VOIDED,
            resourceType: 'SESSION',
            resourceId: sessionId,
            fromState: session.legalStatus,
            toState: client_1.SessionLegalStatus.VOIDED,
            actorId: actor.id,
            timestamp: voidedAt,
            metadata: { reason: dto.reason },
        });
        this.logger.warn(`Session VOIDED: ${sessionId} by ${actor.email}`);
        return {
            sessionId,
            newLegalStatus: client_1.SessionLegalStatus.VOIDED,
        };
    }
    async getAddendums(sessionId, actor) {
        const session = await this.getSessionOrFail(sessionId);
        const addendums = await this.prisma.sessionAddendum.findMany({
            where: { sessionId },
            orderBy: { sequenceNumber: 'asc' },
        });
        const decryptedAddendums = await Promise.all(addendums.map(async (addendum) => {
            try {
                const payload = {
                    encrypted: addendum.contentEncrypted,
                    iv: addendum.contentIV,
                    keyId: addendum.contentKeyId ?? '',
                };
                const decrypted = await this.cryptoService.decryptClinicalNarrative(payload, sessionId);
                return {
                    id: addendum.id,
                    sequenceNumber: addendum.sequenceNumber,
                    content: JSON.parse(decrypted.subjectiveReport ?? '{}'),
                    reason: addendum.reason,
                    authorId: addendum.authorId,
                    signedAt: addendum.signedAt,
                    isLocked: addendum.isLocked,
                    createdAt: addendum.createdAt,
                };
            }
            catch {
                return {
                    id: addendum.id,
                    sequenceNumber: addendum.sequenceNumber,
                    content: null,
                    reason: addendum.reason,
                    authorId: addendum.authorId,
                    signedAt: addendum.signedAt,
                    isLocked: addendum.isLocked,
                    createdAt: addendum.createdAt,
                    decryptionError: true,
                };
            }
        }));
        return {
            sessionId,
            legalStatus: session.legalStatus,
            addendums: decryptedAddendums,
        };
    }
    async getSessionOrFail(id) {
        const session = await this.prisma.clinicalSession.findUnique({
            where: { id },
        });
        if (!session) {
            throw new common_1.NotFoundException(`Sesión no encontrada: ${id}`);
        }
        return session;
    }
    canAmend(status) {
        return amendment_interfaces_1.LEGAL_STATUS_TRANSITIONS[status]?.includes(client_1.SessionLegalStatus.AMENDED) || false;
    }
    canVoid(status) {
        return amendment_interfaces_1.LEGAL_STATUS_TRANSITIONS[status]?.includes(client_1.SessionLegalStatus.VOIDED) || false;
    }
    validateAmendmentAuthorization(session, actor) {
        if (session.therapistId === actor.id) {
            return;
        }
        if (actor.globalRole === client_1.GlobalRole.SUPERVISOR) {
            return;
        }
        throw new common_1.ForbiddenException('Solo el terapeuta de la sesión o un supervisor puede crear enmiendas');
    }
    emitWorkflowEvent(event) {
        this.logger.debug(`Amendment event: ${event.eventType} - ${event.resourceType}:${event.resourceId}`);
    }
};
exports.AmendmentService = AmendmentService;
exports.AmendmentService = AmendmentService = AmendmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        audit_service_1.AuditService])
], AmendmentService);
//# sourceMappingURL=amendment.service.js.map