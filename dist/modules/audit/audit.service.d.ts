import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditResource, GlobalRole } from '@prisma/client';
export interface AuditLogInput {
    actorId?: string;
    actorRole?: GlobalRole;
    actorIp: string;
    actorUserAgent?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId: string;
    patientId?: string;
    details?: Record<string, any>;
    success?: boolean;
    failureReason?: string;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(input: AuditLogInput): Promise<void>;
    logAccessDenied(input: {
        actorId?: string;
        actorIp: string;
        resource: AuditResource;
        resourceId: string;
        reason: string;
    }): Promise<void>;
    findByPatient(patientId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        id: string;
        actorId: string | null;
        actorRole: import(".prisma/client").$Enums.GlobalRole | null;
        actorIp: string;
        actorUserAgent: string | null;
        action: import(".prisma/client").$Enums.AuditAction;
        resource: import(".prisma/client").$Enums.AuditResource;
        resourceId: string;
        patientId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        success: boolean;
        failureReason: string | null;
        timestamp: Date;
    }[]>;
    findByActor(actorId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        id: string;
        actorId: string | null;
        actorRole: import(".prisma/client").$Enums.GlobalRole | null;
        actorIp: string;
        actorUserAgent: string | null;
        action: import(".prisma/client").$Enums.AuditAction;
        resource: import(".prisma/client").$Enums.AuditResource;
        resourceId: string;
        patientId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        success: boolean;
        failureReason: string | null;
        timestamp: Date;
    }[]>;
    private sanitizeDetails;
    logSensitiveAccess(input: {
        actorId: string;
        actorRole: GlobalRole;
        actorIp: string;
        resource: AuditResource;
        resourceId: string;
        patientId?: string;
        accessType: 'VIEW' | 'DOWNLOAD' | 'PRINT';
        fields?: string[];
    }): Promise<void>;
    logExport(input: {
        actorId: string;
        actorRole: GlobalRole;
        actorIp: string;
        exportRecordId: string;
        resource: AuditResource;
        resourceId: string;
        patientId?: string;
        format: string;
        includesPII: boolean;
        maskedPII: boolean;
        recordCount: number;
    }): Promise<void>;
    findByResource(resource: AuditResource, resourceId: string, options?: {
        skip?: number;
        take?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        id: string;
        actorId: string | null;
        actorRole: import(".prisma/client").$Enums.GlobalRole | null;
        actorIp: string;
        actorUserAgent: string | null;
        action: import(".prisma/client").$Enums.AuditAction;
        resource: import(".prisma/client").$Enums.AuditResource;
        resourceId: string;
        patientId: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        success: boolean;
        failureReason: string | null;
        timestamp: Date;
    }[]>;
    getAccessStats(resource: AuditResource, resourceId: string, options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        totalAccesses: number;
        uniqueActors: number;
        byAction: Record<string, number>;
        failedAttempts: number;
    }>;
}
