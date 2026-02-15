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
    getFile(id: string): Promise<{
        attachment: {
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
        };
        filePath: string;
        buffer: NonSharedBuffer;
    }>;
    delete(id: string, user: {
        id: string;
        ip: string;
    }): Promise<void>;
}
