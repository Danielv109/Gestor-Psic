import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { AppointmentsRepository } from '../appointments.repository';
export declare class AppointmentAccessPolicy implements PolicyHandler {
    private readonly collaborationsRepo;
    private readonly appointmentsRepo;
    constructor(collaborationsRepo: CollaborationsRepository, appointmentsRepo: AppointmentsRepository);
    handle(user: AuthenticatedUser, request: any): Promise<boolean>;
}
