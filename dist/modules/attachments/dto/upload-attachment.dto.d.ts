import { AttachmentCategory } from '@prisma/client';
export declare class UploadAttachmentDto {
    category?: AttachmentCategory;
    description?: string;
    sessionId?: string;
}
