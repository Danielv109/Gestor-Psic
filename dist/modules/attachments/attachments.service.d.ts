import { AttachmentsRepository } from './attachments.repository';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AuditService } from '../audit/audit.service';
import 'multer';
export declare class AttachmentsService {
    private readonly repo;
    private readonly audit;
    constructor(repo: AttachmentsRepository, audit: AuditService);
    upload(patientId: string, file: Express.Multer.File, dto: UploadAttachmentDto, user: {
        id: string;
        ip: string;
    }): Promise<{
        id: string;
        uploadedBy: string;
        sessionId: string | null;
        fileName: string;
        fileType: string;
        fileSizeBytes: number;
        storagePath: string;
        category: import(".prisma/client").$Enums.AttachmentCategory;
        description: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        patientId: string;
    }>;
    findByPatient(patientId: string): Promise<{
        id: string;
        uploadedBy: string;
        sessionId: string | null;
        fileName: string;
        fileType: string;
        fileSizeBytes: number;
        storagePath: string;
        category: import(".prisma/client").$Enums.AttachmentCategory;
        description: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        patientId: string;
    }[]>;
    getFile(id: string): Promise<{
        attachment: {
            id: string;
            uploadedBy: string;
            sessionId: string | null;
            fileName: string;
            fileType: string;
            fileSizeBytes: number;
            storagePath: string;
            category: import(".prisma/client").$Enums.AttachmentCategory;
            description: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            patientId: string;
        };
        filePath: string;
        buffer: NonSharedBuffer;
    }>;
    delete(id: string, user: {
        id: string;
        ip: string;
    }): Promise<void>;
}
