// src/modules/export/policies/export-patient.policy.ts
import { Injectable, Logger } from '@nestjs/common';
import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PolicyContext } from '../../../common/interfaces/policy-context.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { PatientsRepository } from '../../patients/patients.repository';
import { GlobalRole, ContextualRole } from '@prisma/client';

/**
 * Política de exportación de historial de paciente
 * 
 * Reglas:
 * - SUPERVISOR: Pacientes supervisados (SUPERVISOR_CASO o TERAPEUTA_TITULAR)
 * - AUDITOR: Solo para auditoría con PII enmascarado
 * - TERAPEUTA: NO puede exportar historial completo
 */
@Injectable()
export class ExportPatientPolicy implements PolicyHandler {
    private readonly logger = new Logger(ExportPatientPolicy.name);

    constructor(
        private readonly collaborationsRepo: CollaborationsRepository,
        private readonly patientsRepo: PatientsRepository,
    ) { }

    async handle(
        user: AuthenticatedUser,
        request: any,
        context?: PolicyContext,
    ): Promise<boolean> {
        const patientId = request.params?.id;

        if (!patientId) {
            return false;
        }

        const patient = await this.patientsRepo.findById(patientId);

        if (!patient) {
            this.logger.warn(`Patient ${patientId} not found for export`);
            return false;
        }

        // AUDITOR: Puede exportar para auditoría
        if (user.globalRole === GlobalRole.AUDITOR) {
            return true;
        }

        // Solo SUPERVISOR puede exportar historial completo
        if (user.globalRole !== GlobalRole.SUPERVISOR) {
            this.logger.warn(
                `User ${user.id} with role ${user.globalRole} cannot export patient history`,
            );
            return false;
        }

        // Verificar colaboración con rol apropiado
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(
            user.id,
            patientId,
        );

        if (!collaboration) {
            this.logger.warn(
                `Supervisor ${user.id} has no collaboration for patient ${patientId}`,
            );
            return false;
        }

        // Solo si es SUPERVISOR_CASO o TERAPEUTA_TITULAR
        const allowedRoles: ContextualRole[] = [
            ContextualRole.SUPERVISOR_CASO,
            ContextualRole.TERAPEUTA_TITULAR,
        ];

        if (!allowedRoles.includes(collaboration.contextualRole)) {
            this.logger.warn(
                `User ${user.id} has insufficient contextual role: ${collaboration.contextualRole}`,
            );
            return false;
        }

        return true;
    }
}
