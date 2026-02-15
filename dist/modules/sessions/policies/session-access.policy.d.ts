import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { SessionsRepository } from '../sessions.repository';
export declare class SessionAccessPolicy implements PolicyHandler {
    private readonly collaborationsRepo;
    private readonly sessionsRepo;
    constructor(collaborationsRepo: CollaborationsRepository, sessionsRepo: SessionsRepository);
    handle(user: AuthenticatedUser, request: any): Promise<boolean>;
}
