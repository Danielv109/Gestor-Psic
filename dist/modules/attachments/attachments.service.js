"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const attachments_repository_1 = require("./attachments.repository");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
require("multer");
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];
let AttachmentsService = class AttachmentsService {
    constructor(repo, audit) {
        this.repo = repo;
        this.audit = audit;
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
    }
    async upload(patientId, file, dto, user) {
        if (!file)
            throw new common_1.BadRequestException('No se proporcionó archivo');
        if (file.size > MAX_FILE_SIZE)
            throw new common_1.BadRequestException('El archivo excede 10MB');
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}. Permitidos: PDF, JPG, PNG, WEBP, GIF`);
        }
        const ext = path.extname(file.originalname);
        const storageName = `${(0, uuid_1.v4)()}${ext}`;
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
            category: dto.category || client_1.AttachmentCategory.OTHER,
            description: dto.description,
        });
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.PATIENT_ATTACHMENT,
            resourceId: attachment.id,
            patientId,
            details: { fileName: file.originalname, fileType: file.mimetype },
        });
        return attachment;
    }
    async findByPatient(patientId) {
        return this.repo.findByPatient(patientId);
    }
    async getFile(id) {
        const attachment = await this.repo.findById(id);
        if (!attachment)
            throw new common_1.NotFoundException('Archivo no encontrado');
        const filePath = path.join(UPLOADS_DIR, attachment.storagePath);
        if (!fs.existsSync(filePath))
            throw new common_1.NotFoundException('Archivo físico no encontrado');
        return {
            attachment,
            filePath,
            buffer: fs.readFileSync(filePath),
        };
    }
    async delete(id, user) {
        const attachment = await this.repo.findById(id);
        if (!attachment)
            throw new common_1.NotFoundException('Archivo no encontrado');
        await this.repo.softDelete(id);
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.DELETE,
            resource: client_1.AuditResource.PATIENT_ATTACHMENT,
            resourceId: id,
            patientId: attachment.patientId,
        });
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attachments_repository_1.AttachmentsRepository,
        audit_service_1.AuditService])
], AttachmentsService);
//# sourceMappingURL=attachments.service.js.map