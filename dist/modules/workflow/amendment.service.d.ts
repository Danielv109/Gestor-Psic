import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateAddendumDto, SignAddendumDto, VoidSessionDto, AmendmentResult } from './interfaces/amendment.interfaces';
export declare class AmendmentService {
    private readonly prisma;
    private readonly cryptoService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, cryptoService: CryptoService, auditService: AuditService);
    createAddendum(sessionId: string, dto: CreateAddendumDto, actor: AuthenticatedUser): Promise<AmendmentResult>;
    signAddendum(addendumId: string, dto: SignAddendumDto, actor: AuthenticatedUser): Promise<AmendmentResult>;
    voidSession(sessionId: string, dto: VoidSessionDto, actor: AuthenticatedUser): Promise<AmendmentResult>;
    getAddendums(sessionId: string, actor: AuthenticatedUser): Promise<{
        sessionId: string;
        legalStatus: import(".prisma/client").$Enums.SessionLegalStatus;
        addendums: ({
            id: string;
            sequenceNumber: number;
            content: any;
            reason: string;
            authorId: string;
            signedAt: Date | null;
            isLocked: boolean;
            createdAt: Date;
            decryptionError?: undefined;
        } | {
            id: string;
            sequenceNumber: number;
            content: null;
            reason: string;
            authorId: string;
            signedAt: Date | null;
            isLocked: boolean;
            createdAt: Date;
            decryptionError: boolean;
        })[];
    }>;
    private getSessionOrFail;
    private canAmend;
    private canVoid;
    private validateAmendmentAuthorization;
    private emitWorkflowEvent;
}
