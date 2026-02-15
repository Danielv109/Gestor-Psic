import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateLegalHoldDto, ReleaseLegalHoldDto, LegalHoldCheckResult } from './interfaces/audit.interfaces';
export declare class LegalHoldService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    createHold(dto: CreateLegalHoldDto, actor: AuthenticatedUser): Promise<{
        id: string;
    }>;
    releaseHold(holdId: string, dto: ReleaseLegalHoldDto, actor: AuthenticatedUser): Promise<void>;
    checkHold(resourceType: string, resourceId: string): Promise<LegalHoldCheckResult>;
    assertNoHold(resourceType: string, resourceId: string): Promise<void>;
    listActiveHolds(options?: {
        resourceType?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        id: string;
        resourceId: string;
        isActive: boolean;
        createdAt: Date;
        resourceType: string;
        reason: string;
        caseNumber: string | null;
        holdUntil: Date | null;
        createdBy: string;
        releasedBy: string | null;
        releasedAt: Date | null;
        releaseReason: string | null;
    }[]>;
    private validateResourceExists;
    private mapResourceType;
}
