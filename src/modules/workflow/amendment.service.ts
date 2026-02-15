// src/modules/workflow/amendment.service.ts
import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
    CreateAddendumDto,
    SignAddendumDto,
    VoidSessionDto,
    AmendmentResult,
    LEGAL_STATUS_TRANSITIONS,
} from './interfaces/amendment.interfaces';
import { WorkflowEvent, WorkflowEventType } from './interfaces/workflow.interfaces';
import { AuditAction, AuditResource, SessionLegalStatus, GlobalRole } from '@prisma/client';

/**
 * AmendmentService
 * 
 * Gestiona el flujo de enmiendas (amendments) para sesiones firmadas.
 * 
 * REGLA CRÍTICA: La narrativa original NUNCA se modifica.
 * Los addendums son documentos separados vinculados a la sesión original.
 */
@Injectable()
export class AmendmentService {
    private readonly logger = new Logger(AmendmentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cryptoService: CryptoService,
        private readonly auditService: AuditService,
    ) { }

    // ============================================================
    // CREAR ADDENDUM (ENMIENDA)
    // ============================================================

    /**
     * Crear un addendum para una sesión firmada
     * 
     * Pre-condiciones:
     * - Sesión debe estar SIGNED o AMENDED
     * - Actor debe ser el terapeuta de la sesión o SUPERVISOR
     * 
     * Post-condiciones:
     * - Se crea SessionAddendum en estado borrador
     * - La sesión original NO se modifica
     */
    async createAddendum(
        sessionId: string,
        dto: CreateAddendumDto,
        actor: AuthenticatedUser,
    ): Promise<AmendmentResult> {
        const session = await this.getSessionOrFail(sessionId);

        // Validar que la sesión está en estado que permite enmiendas
        if (!this.canAmend(session.legalStatus)) {
            throw new BadRequestException(
                `No se puede enmendar una sesión en estado: ${session.legalStatus}. ` +
                `Solo sesiones SIGNED o AMENDED pueden ser enmendadas.`,
            );
        }

        // Validar autorización
        this.validateAmendmentAuthorization(session, actor);

        // Obtener número de secuencia
        const lastAddendum = await this.prisma.sessionAddendum.findFirst({
            where: { sessionId },
            orderBy: { sequenceNumber: 'desc' },
        });
        const sequenceNumber = (lastAddendum?.sequenceNumber || 0) + 1;

        // Cifrar contenido del addendum
        const contentJson = JSON.stringify(dto.content);
        const encrypted = await this.cryptoService.encryptClinicalNarrative({
            subjectiveReport: contentJson,
            objectiveObservation: '',
            assessment: '',
            plan: '',
        });

        // Crear addendum
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

        // Auditar creación
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.CLINICAL_SESSION,
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
            eventType: WorkflowEventType.SESSION_AMENDED,
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
            newLegalStatus: session.legalStatus, // No cambia hasta firmar
            sequenceNumber,
        };
    }

    // ============================================================
    // FIRMAR ADDENDUM
    // ============================================================

    /**
     * Firmar un addendum
     * 
     * Pre-condiciones:
     * - Addendum debe existir y no estar firmado
     * - Solo el autor puede firmar
     * 
     * Post-condiciones:
     * - Addendum queda locked
     * - Sesión pasa a AMENDED
     */
    async signAddendum(
        addendumId: string,
        dto: SignAddendumDto,
        actor: AuthenticatedUser,
    ): Promise<AmendmentResult> {
        const addendum = await this.prisma.sessionAddendum.findUnique({
            where: { id: addendumId },
            include: { session: true },
        });

        if (!addendum) {
            throw new NotFoundException(`Addendum no encontrado: ${addendumId}`);
        }

        // Validar que no está ya firmado
        if (addendum.isLocked || addendum.signedAt) {
            throw new BadRequestException('El addendum ya está firmado');
        }

        // Validar autor
        if (addendum.authorId !== actor.id) {
            throw new ForbiddenException('Solo el autor puede firmar el addendum');
        }

        const signedAt = new Date();

        // Generar hash de firma
        const signatureHash = this.cryptoService.generateSessionSignature(
            addendumId,
            actor.id,
            signedAt,
        );

        // Firmar addendum
        await this.prisma.sessionAddendum.update({
            where: { id: addendumId },
            data: {
                signedAt,
                signatureHash,
                isLocked: true,
            },
        });

        // Actualizar estado legal de la sesión
        await this.prisma.clinicalSession.update({
            where: { id: addendum.sessionId },
            data: {
                legalStatus: SessionLegalStatus.AMENDED,
                amendedAt: signedAt,
                amendReason: addendum.reason,
                amendedBy: actor.id,
            },
        });

        // Auditar firma
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.CLINICAL_SESSION,
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
            eventType: WorkflowEventType.AMENDMENT_SIGNED,
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
            newLegalStatus: SessionLegalStatus.AMENDED,
            signatureHash,
        };
    }

    // ============================================================
    // ANULAR SESIÓN
    // ============================================================

    /**
     * Anular una sesión
     * 
     * Pre-condiciones:
     * - Sesión debe estar SIGNED o AMENDED
     * - Solo SUPERVISOR o ADMIN puede anular
     * 
     * Post-condiciones:
     * - Sesión queda en estado VOIDED
     * - Contenido permanece para auditoría
     */
    async voidSession(
        sessionId: string,
        dto: VoidSessionDto,
        actor: AuthenticatedUser,
    ): Promise<AmendmentResult> {
        const session = await this.getSessionOrFail(sessionId);

        // Validar estado permite anulación
        if (!this.canVoid(session.legalStatus)) {
            throw new BadRequestException(
                `No se puede anular una sesión en estado: ${session.legalStatus}. ` +
                `Solo sesiones SIGNED o AMENDED pueden ser anuladas.`,
            );
        }

        // Solo SUPERVISOR puede anular
        if (actor.globalRole !== GlobalRole.SUPERVISOR) {
            throw new ForbiddenException(
                'Solo supervisores pueden anular sesiones',
            );
        }

        const voidedAt = new Date();

        // Anular sesión
        await this.prisma.clinicalSession.update({
            where: { id: sessionId },
            data: {
                legalStatus: SessionLegalStatus.VOIDED,
                voidedAt,
                voidReason: `${dto.reason}: ${dto.justification}`,
                voidedBy: actor.id,
            },
        });

        // Auditar anulación
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
                reason: dto.reason,
                justification: dto.justification,
                previousStatus: session.legalStatus,
                action: 'void_session',
            },
        });

        this.emitWorkflowEvent({
            eventType: WorkflowEventType.SESSION_VOIDED,
            resourceType: 'SESSION',
            resourceId: sessionId,
            fromState: session.legalStatus,
            toState: SessionLegalStatus.VOIDED,
            actorId: actor.id,
            timestamp: voidedAt,
            metadata: { reason: dto.reason },
        });

        this.logger.warn(`Session VOIDED: ${sessionId} by ${actor.email}`);

        return {
            sessionId,
            newLegalStatus: SessionLegalStatus.VOIDED,
        };
    }

    // ============================================================
    // CONSULTAS
    // ============================================================

    /**
     * Obtener addendums de una sesión
     */
    async getAddendums(sessionId: string, actor: AuthenticatedUser) {
        const session = await this.getSessionOrFail(sessionId);

        const addendums = await this.prisma.sessionAddendum.findMany({
            where: { sessionId },
            orderBy: { sequenceNumber: 'asc' },
        });

        // Descifrar contenido de cada addendum
        const decryptedAddendums = await Promise.all(
            addendums.map(async (addendum) => {
                try {
                    const payload = {
                        encrypted: addendum.contentEncrypted,
                        iv: addendum.contentIV,
                        keyId: addendum.contentKeyId ?? '',
                    };
                    const decrypted = await this.cryptoService.decryptClinicalNarrative(
                        payload,
                        sessionId,
                    );
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
                } catch {
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
            }),
        );

        return {
            sessionId,
            legalStatus: session.legalStatus,
            addendums: decryptedAddendums,
        };
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private async getSessionOrFail(id: string) {
        const session = await this.prisma.clinicalSession.findUnique({
            where: { id },
        });
        if (!session) {
            throw new NotFoundException(`Sesión no encontrada: ${id}`);
        }
        return session;
    }

    private canAmend(status: SessionLegalStatus): boolean {
        return LEGAL_STATUS_TRANSITIONS[status]?.includes(SessionLegalStatus.AMENDED) || false;
    }

    private canVoid(status: SessionLegalStatus): boolean {
        return LEGAL_STATUS_TRANSITIONS[status]?.includes(SessionLegalStatus.VOIDED) || false;
    }

    private validateAmendmentAuthorization(session: any, actor: AuthenticatedUser) {
        // Terapeuta original puede enmendar
        if (session.therapistId === actor.id) {
            return;
        }

        // SUPERVISOR puede enmendar
        if (actor.globalRole === GlobalRole.SUPERVISOR) {
            return;
        }

        throw new ForbiddenException(
            'Solo el terapeuta de la sesión o un supervisor puede crear enmiendas',
        );
    }

    private emitWorkflowEvent(event: WorkflowEvent) {
        this.logger.debug(
            `Amendment event: ${event.eventType} - ${event.resourceType}:${event.resourceId}`,
        );
    }
}
