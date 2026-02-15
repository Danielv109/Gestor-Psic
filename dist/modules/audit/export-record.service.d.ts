import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { LogExportDto } from './interfaces/audit.interfaces';
export declare class ExportRecordService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    recordExport(dto: LogExportDto, actor: AuthenticatedUser): Promise<{
        exportRecordId: string;
    }>;
    findByResource(resourceType: string, resourceId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        id: string;
        resourceId: string;
        patientId: string | null;
        success: boolean;
        format: string;
        includesPII: boolean;
        maskedPII: boolean;
        recordCount: number;
        resourceType: string;
        exportedBy: string;
        exportedByIp: string;
        fileSizeBytes: number | null;
        exportedAt: Date;
    }[]>;
    findByPatient(patientId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        id: string;
        resourceId: string;
        patientId: string | null;
        success: boolean;
        format: string;
        includesPII: boolean;
        maskedPII: boolean;
        recordCount: number;
        resourceType: string;
        exportedBy: string;
        exportedByIp: string;
        fileSizeBytes: number | null;
        exportedAt: Date;
    }[]>;
    findByUser(userId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        id: string;
        resourceId: string;
        patientId: string | null;
        success: boolean;
        format: string;
        includesPII: boolean;
        maskedPII: boolean;
        recordCount: number;
        resourceType: string;
        exportedBy: string;
        exportedByIp: string;
        fileSizeBytes: number | null;
        exportedAt: Date;
    }[]>;
    getStats(options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        totalExports: number;
        byFormat: Record<string, number>;
        byResourceType: Record<string, number>;
        withPII: number;
        withMaskedPII: number;
        uniqueExporters: number;
    }>;
    private mapResourceType;
}
