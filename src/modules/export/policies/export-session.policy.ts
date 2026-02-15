// src/modules/export/policies/export-session.policy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PolicyContext } from '../../../common/interfaces/policy-context.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { SessionsRepository } from '../../sessions/sessions.repository';
import { GlobalRole } from '@prisma/client';

/**
 * Política de exportación de sesiones clínicas
 * 
 * Reglas:
 * - TERAPEUTA: Solo sus pacientes (colaboración activa)
 * - SUPERVISOR: Pacientes supervisados
 * - AUDITOR: Solo con PII enmascarado (verificado en servicio)
 */
@Injectable()
export class ExportSessionPolicy implements PolicyHandler {
    private readonly logger = new Logger(ExportSessionPolicy.name);

    constructor(
        private readonly collaborationsRepo: CollaborationsRepository,
        private readonly sessionsRepo: SessionsRepository,
    ) { }

    async handle(
        user: AuthenticatedUser,
        request: any,
        context?: PolicyContext,
    ): Promise<boolean> {
        const sessionId = request.params?.id;

        if (!sessionId) {
            return false;
        }

        const session = await this.sessionsRepo.findById(sessionId);

        if (!session) {
            this.logger.warn(`Session ${sessionId} not found for export`);
            return false;
        }

        // AUDITOR: Puede exportar para auditoría, pero PII será enmascarado
        if (user.globalRole === GlobalRole.AUDITOR) {
            // Verificar que la sesión esté firmada (solo exportar finalizadas)
            if (!session.signedAt) {
                this.logger.warn(`Auditor ${user.id} tried to export unsigned session`);
                return false;
            }
            return true;
        }

        // TERAPEUTA/SUPERVISOR: Verificar colaboración con el paciente
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(
            user.id,
            session.patientId,
        );

        if (!collaboration) {
            this.logger.warn(
                `User ${user.id} has no collaboration for patient ${session.patientId}`,
            );
            return false;
        }

        return true;
    }
}
