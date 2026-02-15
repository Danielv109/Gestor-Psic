import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { Response } from 'express';
import 'multer';
export declare class AttachmentsController {
    private readonly attachments;
    constructor(attachments: AttachmentsService);
    upload(patientId: string, file: Express.Multer.File, dto: UploadAttachmentDto, req: any): Promise<{
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
    list(patientId: string): Promise<{
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
    download(id: string, res: Response): Promise<void>;
    delete(id: string, req: any): Promise<void>;
}
