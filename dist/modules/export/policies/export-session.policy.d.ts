import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PolicyContext } from '../../../common/interfaces/policy-context.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { SessionsRepository } from '../../sessions/sessions.repository';
export declare class ExportSessionPolicy implements PolicyHandler {
    private readonly collaborationsRepo;
    private readonly sessionsRepo;
    private readonly logger;
    constructor(collaborationsRepo: CollaborationsRepository, sessionsRepo: SessionsRepository);
    handle(user: AuthenticatedUser, request: any, context?: PolicyContext): Promise<boolean>;
}
