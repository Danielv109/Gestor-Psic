import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CollaborationsRepository } from '../collaborations/collaborations.repository';
import { ExportDocument, ExportOptions, PdfDocumentStructure } from './interfaces/export.interfaces';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ExportService {
    private readonly prisma;
    private readonly cryptoService;
    private readonly auditService;
    private readonly collaborationsRepo;
    private readonly logger;
    constructor(prisma: PrismaService, cryptoService: CryptoService, auditService: AuditService, collaborationsRepo: CollaborationsRepository);
    exportSession(sessionId: string, actor: AuthenticatedUser, options: ExportOptions): Promise<ExportDocument>;
    exportPatientHistory(patientId: string, actor: AuthenticatedUser, options: ExportOptions): Promise<ExportDocument>;
    generatePdfStructure(doc: ExportDocument): PdfDocumentStructure;
    private buildPdfSections;
    private getPermissions;
    private verifyPatientAccess;
    private masked;
    private isMasked;
    private renderField;
    private buildExportDocument;
    private auditExportDenied;
}
