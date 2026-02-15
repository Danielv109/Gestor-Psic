import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class AttachmentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.PatientAttachmentUncheckedCreateInput): Promise<{
        id: string;
        patientId: string;
        deletedAt: Date | null;
        createdAt: Date;
        sessionId: string | null;
        fileSizeBytes: number;
        uploadedBy: string;
        fileName: string;
        fileType: string;
        storagePath: string;
        category: import(".prisma/client").$Enums.AttachmentCategory;
        description: string | null;
    }>;
    findById(id: string): Promise<{
        id: string;
        patientId: string;
        deletedAt: Date | null;
        createdAt: Date;
        sessionId: string | null;
        fileSizeBytes: number;
        uploadedBy: string;
        fileName: string;
        fileType: string;
        storagePath: string;
        category: import(".prisma/client").$Enums.AttachmentCategory;
        description: string | null;
    } | null>;
    findByPatient(patientId: string): Promise<{
        id: string;
        patientId: string;
        deletedAt: Date | null;
        createdAt: Date;
        sessionId: string | null;
        fileSizeBytes: number;
        uploadedBy: string;
        fileName: string;
        fileType: string;
        storagePath: string;
        category: import(".prisma/client").$Enums.AttachmentCategory;
        description: string | null;
    }[]>;
    softDelete(id: string): Promise<{
        id: string;
        patientId: string;
        deletedAt: Date | null;
        createdAt: Date;
        sessionId: string | null;
        fileSizeBytes: number;
        uploadedBy: string;
        fileName: string;
        fileType: string;
        storagePath: string;
        category: import(".prisma/client").$Enums.AttachmentCategory;
        description: string | null;
    }>;
}
