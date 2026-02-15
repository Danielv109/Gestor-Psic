import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AttachmentsRepository } from './attachments.repository';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource, AttachmentCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import 'multer'; // Import for Express.Multer.File type

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

@Injectable()
export class AttachmentsService {
    constructor(
        private readonly repo: AttachmentsRepository,
        private readonly audit: AuditService,
    ) {
        // Ensure uploads directory exists
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
    }

    async upload(
        patientId: string,
        file: Express.Multer.File,
        dto: UploadAttachmentDto,
        user: { id: string; ip: string },
    ) {
        if (!file) throw new BadRequestException('No se proporcionó archivo');
        if (file.size > MAX_FILE_SIZE) throw new BadRequestException('El archivo excede 10MB');
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}. Permitidos: PDF, JPG, PNG, WEBP, GIF`);
        }

        // Save file with UUID name to prevent collisions
        const ext = path.extname(file.originalname);
        const storageName = `${uuid()}${ext}`;
        const storagePath = path.join(UPLOADS_DIR, storageName);

        fs.writeFileSync(storagePath, file.buffer);

        const attachment = await this.repo.create({
            patientId,
            uploadedBy: user.id,
            sessionId: dto.sessionId || null,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSizeBytes: file.size,
            storagePath: storageName,
            category: dto.category || AttachmentCategory.OTHER,
            description: dto.description,
        });

        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.PATIENT_ATTACHMENT,
            resourceId: attachment.id,
            patientId,
            details: { fileName: file.originalname, fileType: file.mimetype },
        });

        return attachment;
    }

    async findByPatient(patientId: string) {
        return this.repo.findByPatient(patientId);
    }

    async getFile(id: string) {
        const attachment = await this.repo.findById(id);
        if (!attachment) throw new NotFoundException('Archivo no encontrado');

        const filePath = path.join(UPLOADS_DIR, attachment.storagePath);
        if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo físico no encontrado');

        return {
            attachment,
            filePath,
            buffer: fs.readFileSync(filePath),
        };
    }

    async delete(id: string, user: { id: string; ip: string }) {
        const attachment = await this.repo.findById(id);
        if (!attachment) throw new NotFoundException('Archivo no encontrado');

        await this.repo.softDelete(id);

        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.DELETE,
            resource: AuditResource.PATIENT_ATTACHMENT,
            resourceId: id,
            patientId: attachment.patientId,
        });
    }
}
