import { ExportService } from './export.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ExportFormat } from './interfaces/export.interfaces';
declare class ExportOptionsDto {
    format?: ExportFormat;
    includeNarrative?: boolean;
    includePatientDetails?: boolean;
    maskPII?: boolean;
    timezone?: string;
}
export declare class ExportController {
    private readonly exportService;
    constructor(exportService: ExportService);
    exportSession(sessionId: string, options: ExportOptionsDto, user: AuthenticatedUser): Promise<import("./interfaces/export.interfaces").ExportDocument>;
    getSessionPdfStructure(sessionId: string, options: ExportOptionsDto, user: AuthenticatedUser): Promise<{
        document: import("./interfaces/export.interfaces").ExportDocument;
        pdfStructure: import("./interfaces/export.interfaces").PdfDocumentStructure;
    }>;
    exportPatientHistory(patientId: string, options: ExportOptionsDto, user: AuthenticatedUser): Promise<import("./interfaces/export.interfaces").ExportDocument>;
    getMyExportPermissions(user: AuthenticatedUser): Promise<{
        role: import(".prisma/client").$Enums.GlobalRole;
        permissions: import("./interfaces/export.interfaces").ExportPermissions;
        notes: string[];
    }>;
    private getPermissionNotes;
}
export {};
