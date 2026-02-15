import {
    Controller, Get, Post, Delete, Param, Body, Req, Res,
    UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { Response } from 'express';
import 'multer'; // Import for Express.Multer.File type

@Controller()
export class AttachmentsController {
    constructor(private readonly attachments: AttachmentsService) { }

    @Post('patients/:patientId/attachments')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }))
    async upload(
        @Param('patientId') patientId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadAttachmentDto,
        @Req() req: any,
    ) {
        return this.attachments.upload(patientId, file, dto, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }

    @Get('patients/:patientId/attachments')
    async list(@Param('patientId') patientId: string) {
        return this.attachments.findByPatient(patientId);
    }

    @Get('attachments/:id/download')
    async download(@Param('id') id: string, @Res() res: Response) {
        const { attachment, buffer } = await this.attachments.getFile(id);
        res.set({
            'Content-Type': attachment.fileType,
            'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
            'Content-Length': buffer.length,
        });
        res.send(buffer);
    }

    @Delete('attachments/:id')
    async delete(@Param('id') id: string, @Req() req: any) {
        return this.attachments.delete(id, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }
}
