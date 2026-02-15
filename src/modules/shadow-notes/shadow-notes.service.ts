// src/modules/shadow-notes/shadow-notes.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { ShadowNotesRepository } from './shadow-notes.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CreateShadowNoteDto, UpdateShadowNoteDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditAction, AuditResource } from '@prisma/client';
import { DecryptionError } from '../../crypto/interfaces/crypto.interfaces';

@Injectable()
export class ShadowNotesService {
    constructor(
        private readonly shadowNotesRepo: ShadowNotesRepository,
        private readonly sessionsRepo: SessionsRepository,
        private readonly cryptoService: CryptoService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Crear nota sombra
     * Cifrada con clave PERSONAL del terapeuta
     */
    async create(dto: CreateShadowNoteDto, actor: AuthenticatedUser) {
        // Verificar que la sesión existe
        const session = await this.sessionsRepo.findById(dto.sessionId);

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        // Solo el terapeuta de la sesión puede crear nota sombra
        if (session.therapistId !== actor.id) {
            throw new ForbiddenException(
                'Solo el terapeuta de la sesión puede crear notas sombra',
            );
        }

        // Verificar que no existe nota sombra para esta sesión
        const exists = await this.shadowNotesRepo.existsForSession(dto.sessionId);

        if (exists) {
            throw new ConflictException('Ya existe una nota sombra para esta sesión');
        }

        // Cifrar contenido con clave personal del terapeuta
        const { encrypted, iv } = await this.cryptoService.encryptShadowNote(
            dto.content,
            actor.id,
        );

        const shadowNote = await this.shadowNotesRepo.create({
            session: { connect: { id: dto.sessionId } },
            therapist: { connect: { id: actor.id } },
            contentEncrypted: encrypted,
            contentIV: iv,
        });

        // Auditoría: CREATE (no incluir contenido)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.SHADOW_NOTE,
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

    /**
     * Obtener nota sombra por ID (descifrada)
     */
    async findById(id: string, actor: AuthenticatedUser) {
        const note = await this.shadowNotesRepo.findById(id);

        if (!note) {
            throw new NotFoundException('Nota sombra no encontrada');
        }

        // Doble verificación de ownership
        if (note.therapistId !== actor.id) {
            throw new ForbiddenException('Sin acceso a esta nota sombra');
        }

        // Obtener sesión para el patientId
        const session = await this.sessionsRepo.findById(note.sessionId);

        // Descifrar contenido
        let content: string;
        try {
            content = await this.cryptoService.decryptShadowNote(
                note.contentEncrypted,
                note.contentIV,
                actor.id,
                id,
            );
        } catch (error) {
            if (error instanceof DecryptionError) {
                throw new BadRequestException('Error al descifrar nota sombra');
            }
            throw error;
        }

        // Auditoría: READ + DECRYPT
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.DECRYPT,
            resource: AuditResource.SHADOW_NOTE,
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

    /**
     * Obtener nota sombra por sesión
     */
    async findBySession(sessionId: string, actor: AuthenticatedUser) {
        const note = await this.shadowNotesRepo.findBySession(sessionId);

        if (!note) {
            return null; // No es error, simplemente no existe
        }

        // Verificar ownership
        if (note.therapistId !== actor.id) {
            // No revelar que existe una nota de otro terapeuta
            return null;
        }

        return this.findById(note.id, actor);
    }

    /**
     * Listar mis notas sombra (solo metadatos)
     */
    async findMyNotes(actor: AuthenticatedUser) {
        const notes = await this.shadowNotesRepo.findByTherapist(actor.id);

        // Auditoría: READ (lista)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.SHADOW_NOTE,
            resourceId: actor.id,
            success: true,
            details: { count: notes.length, type: 'list' },
        });

        // Devolver solo metadatos, no contenido
        return notes.map((n) => ({
            id: n.id,
            sessionId: n.sessionId,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
        }));
    }

    /**
     * Actualizar nota sombra
     */
    async update(id: string, dto: UpdateShadowNoteDto, actor: AuthenticatedUser) {
        const note = await this.shadowNotesRepo.findById(id);

        if (!note) {
            throw new NotFoundException('Nota sombra no encontrada');
        }

        // Verificar ownership
        if (note.therapistId !== actor.id) {
            throw new ForbiddenException('Sin acceso a esta nota sombra');
        }

        // Cifrar nuevo contenido con clave personal
        const { encrypted, iv } = await this.cryptoService.encryptShadowNote(
            dto.content,
            actor.id,
        );

        const updated = await this.shadowNotesRepo.update(id, {
            contentEncrypted: encrypted,
            contentIV: iv,
        });

        // Obtener sesión para el patientId
        const session = await this.sessionsRepo.findById(note.sessionId);

        // Auditoría: UPDATE
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.SHADOW_NOTE,
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

    /**
     * Eliminar nota sombra (soft delete)
     */
    async softDelete(id: string, actor: AuthenticatedUser) {
        const note = await this.shadowNotesRepo.findById(id);

        if (!note) {
            throw new NotFoundException('Nota sombra no encontrada');
        }

        // Verificar ownership
        if (note.therapistId !== actor.id) {
            throw new ForbiddenException('Sin acceso a esta nota sombra');
        }

        await this.shadowNotesRepo.softDelete(id);

        // Obtener sesión para el patientId
        const session = await this.sessionsRepo.findById(note.sessionId);

        // Auditoría: DELETE (soft)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.DELETE,
            resource: AuditResource.SHADOW_NOTE,
            resourceId: id,
            patientId: session?.patientId,
            success: true,
            details: { softDelete: true },
        });
    }
}
