import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
export declare class PatientAccessPolicy implements PolicyHandler {
    private readonly collaborationsRepo;
    constructor(collaborationsRepo: CollaborationsRepository);
    handle(user: AuthenticatedUser, request: any): Promise<boolean>;
}
