// src/modules/patients/policies/patient-access.policy.ts
import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { GlobalRole } from '@prisma/client';

@Injectable()
export class PatientAccessPolicy implements PolicyHandler {
    constructor(private readonly collaborationsRepo: CollaborationsRepository) { }

    async handle(user: AuthenticatedUser, request: any): Promise<boolean> {
        // Auditores no acceden a datos de pacientes directamente
        if (user.globalRole === GlobalRole.AUDITOR) {
            return false;
        }

        const patientId = request.params?.id || request.params?.patientId;

        if (!patientId) {
            // Si no hay patientId, permitir (será una lista filtrada)
            return true;
        }

        // ABAC: Verificar colaboración activa con el paciente
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(
            user.id,
            patientId,
        );

        return collaboration !== null;
    }
}
