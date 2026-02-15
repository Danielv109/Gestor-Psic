import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PolicyContext } from '../../../common/interfaces/policy-context.interface';
import { CollaborationsRepository } from '../../collaborations/collaborations.repository';
import { PatientsRepository } from '../../patients/patients.repository';
export declare class ExportPatientPolicy implements PolicyHandler {
    private readonly collaborationsRepo;
    private readonly patientsRepo;
    private readonly logger;
    constructor(collaborationsRepo: CollaborationsRepository, patientsRepo: PatientsRepository);
    handle(user: AuthenticatedUser, request: any, context?: PolicyContext): Promise<boolean>;
}
