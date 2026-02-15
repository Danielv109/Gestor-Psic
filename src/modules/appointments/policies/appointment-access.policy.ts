// src/modules/appointments/policies/appointment-access.policy.ts
import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { AppointmentsRepository } from '../appointments.repository';
import { GlobalRole } from '@prisma/client';

@Injectable()
export class AppointmentAccessPolicy implements PolicyHandler {
    constructor(
        private readonly collaborationsRepo: CollaborationsRepository,
        private readonly appointmentsRepo: AppointmentsRepository,
    ) { }

    async handle(user: AuthenticatedUser, request: any): Promise<boolean> {
        // Auditores no acceden a citas
        if (user.globalRole === GlobalRole.AUDITOR) {
            return false;
        }

        const appointmentId = request.params?.id;

        if (!appointmentId) {
            return true;
        }

        // Obtener la cita para saber el paciente
        const appointment = await this.appointmentsRepo.findById(appointmentId);

        if (!appointment) {
            return false;
        }

        // ABAC: Verificar colaboración con el paciente de la cita
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(
            user.id,
            appointment.patientId,
        );

        return collaboration !== null;
    }
}
