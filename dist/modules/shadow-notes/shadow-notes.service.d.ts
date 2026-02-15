import { ShadowNotesRepository } from './shadow-notes.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CreateShadowNoteDto, UpdateShadowNoteDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ShadowNotesService {
    private readonly shadowNotesRepo;
    private readonly sessionsRepo;
    private readonly cryptoService;
    private readonly auditService;
    constructor(shadowNotesRepo: ShadowNotesRepository, sessionsRepo: SessionsRepository, cryptoService: CryptoService, auditService: AuditService);
    create(dto: CreateShadowNoteDto, actor: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        createdAt: Date;
    }>;
    findById(id: string, actor: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findBySession(sessionId: string, actor: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findMyNotes(actor: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    update(id: string, dto: UpdateShadowNoteDto, actor: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        updatedAt: Date;
    }>;
    softDelete(id: string, actor: AuthenticatedUser): Promise<void>;
}
