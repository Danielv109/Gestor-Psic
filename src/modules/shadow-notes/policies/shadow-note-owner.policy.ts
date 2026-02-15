// src/modules/shadow-notes/policies/shadow-note-owner.policy.ts
import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { ShadowNotesRepository } from '../shadow-notes.repository';

/**
 * POLÍTICA CRÍTICA: Shadow Notes solo accesibles por su propietario
 * 
 * Las notas sombra son PRIVADAS del terapeuta.
 * NADIE más puede verlas: ni supervisores, ni auditores, ni otros terapeutas.
 */
@Injectable()
export class ShadowNoteOwnerPolicy implements PolicyHandler {
    constructor(private readonly shadowNotesRepo: ShadowNotesRepository) { }

    async handle(user: AuthenticatedUser, request: any): Promise<boolean> {
        const noteId = request.params?.id;

        if (!noteId) {
            // Para crear, verificamos ownership en el service
            return true;
        }

        const note = await this.shadowNotesRepo.findById(noteId);

        if (!note) {
            return false;
        }

        // REGLA ABSOLUTA: Solo el terapeuta propietario puede acceder
        return note.therapistId === user.id;
    }
}
