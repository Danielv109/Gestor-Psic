import { SessionsRepository } from './sessions.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CreateSessionDto, UpdateSessionDto, SignSessionDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class SessionsService {
    private readonly sessionsRepo;
    private readonly appointmentsRepo;
    private readonly cryptoService;
    private readonly auditService;
    constructor(sessionsRepo: SessionsRepository, appointmentsRepo: AppointmentsRepository, cryptoService: CryptoService, auditService: AuditService);
    create(dto: CreateSessionDto, actor: AuthenticatedUser): Promise<any>;
    findById(id: string, actor: AuthenticatedUser): Promise<any>;
    findByTherapist(actor: AuthenticatedUser, isDraft?: boolean): Promise<any[]>;
    findByPatient(patientId: string, actor: AuthenticatedUser): Promise<any[]>;
    update(id: string, dto: UpdateSessionDto, actor: AuthenticatedUser): Promise<any>;
    sign(id: string, dto: SignSessionDto, actor: AuthenticatedUser): Promise<any>;
    getVersions(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        versionNumber: number;
        createdAt: Date;
        changeReason: string | null;
    }[]>;
    reEncryptSession(id: string, actor: AuthenticatedUser): Promise<{
        success: boolean;
        newKeyId: string;
    }>;
    private safeDecryptNarrative;
    private sanitizeSession;
    private calculateDuration;
}
