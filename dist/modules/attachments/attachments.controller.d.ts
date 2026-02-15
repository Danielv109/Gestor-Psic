import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { Response } from 'express';
import 'multer';
export declare class AttachmentsController {
    private readonly attachments;
    constructor(attachments: AttachmentsService);
    upload(patientId: string, file: Express.Multer.File, dto: UploadAttachmentDto, req: any): Promise<{
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
    list(patientId: string): Promise<{
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
    download(id: string, res: Response): Promise<void>;
    delete(id: string, req: any): Promise<void>;
}
