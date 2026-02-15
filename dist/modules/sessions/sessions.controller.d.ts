import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto, SignSessionDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    create(dto: CreateSessionDto, user: AuthenticatedUser): Promise<any>;
    findMySessions(isDraft: boolean | undefined, user: AuthenticatedUser): Promise<any[]>;
    findByPatient(patientId: string, user: AuthenticatedUser): Promise<any[]>;
    findById(id: string, user: AuthenticatedUser): Promise<any>;
    getVersions(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        versionNumber: number;
        createdAt: Date;
        changeReason: string | null;
    }[]>;
    update(id: string, dto: UpdateSessionDto, user: AuthenticatedUser): Promise<any>;
    sign(id: string, dto: SignSessionDto, user: AuthenticatedUser): Promise<any>;
}
