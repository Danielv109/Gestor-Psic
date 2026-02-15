// src/modules/sessions/policies/session-access.policy.ts
import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { SessionsRepository } from '../sessions.repository';
import { GlobalRole, ContextualRole } from '@prisma/client';

@Injectable()
export class SessionAccessPolicy implements PolicyHandler {
    constructor(
        private readonly collaborationsRepo: CollaborationsRepository,
        private readonly sessionsRepo: SessionsRepository,
    ) { }

    async handle(user: AuthenticatedUser, request: any): Promise<boolean> {
        // Auditores no acceden a contenido clínico
        if (user.globalRole === GlobalRole.AUDITOR) {
            return false;
        }

        const sessionId = request.params?.id;

        if (!sessionId) {
            return true;
        }

        const session = await this.sessionsRepo.findById(sessionId);

        if (!session) {
            return false;
        }

        // Verificar colaboración con el paciente
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(
            user.id,
            session.patientId,
        );

        if (!collaboration) {
            return false;
        }

        // Para editar: solo TERAPEUTA_TITULAR o el terapeuta de la sesión
        if (request.method === 'PUT' || request.method === 'DELETE') {
            // El terapeuta de la sesión puede editar
            if (session.therapistId === user.id) {
                return true;
            }

            // SUPERVISOR_CASO puede ver pero no editar
            if (collaboration.contextualRole === ContextualRole.SUPERVISOR_CASO) {
                return request.method === 'GET';
            }

            return false;
        }

        return true;
    }
}
