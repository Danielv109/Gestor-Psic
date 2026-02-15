import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AttachmentCategory } from '@prisma/client';

export class UploadAttachmentDto {
    @IsOptional()
    @IsEnum(AttachmentCategory)
    category?: AttachmentCategory;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    sessionId?: string;
}
