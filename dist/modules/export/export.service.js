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
var ExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_service_1 = require("../../crypto/crypto.service");
const audit_service_1 = require("../audit/audit.service");
const collaborations_repository_1 = require("../collaborations/collaborations.repository");
const export_interfaces_1 = require("./interfaces/export.interfaces");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let ExportService = ExportService_1 = class ExportService {
    constructor(prisma, cryptoService, auditService, collaborationsRepo) {
        this.prisma = prisma;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
        this.collaborationsRepo = collaborationsRepo;
        this.logger = new common_1.Logger(ExportService_1.name);
    }
    async exportSession(sessionId, actor, options) {
        const permissions = this.getPermissions(actor.globalRole);
        if (!permissions.canExportSessions) {
            await this.auditExportDenied(actor, 'SESSION', sessionId, 'No export permission');
            throw new common_1.ForbiddenException('No tiene permisos para exportar sesiones');
        }
        const session = await this.prisma.clinicalSession.findUnique({
            where: { id: sessionId },
            include: {
                patient: true,
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                appointment: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        const hasAccess = await this.verifyPatientAccess(actor, session.patientId);
        if (!hasAccess && actor.globalRole !== client_1.GlobalRole.AUDITOR) {
            await this.auditExportDenied(actor, 'SESSION', sessionId, 'No patient collaboration');
            throw new common_1.ForbiddenException('No tiene acceso a este paciente');
        }
        const shadowNote = await this.prisma.shadowNote.findUnique({
            where: { sessionId },
            select: { id: true, therapistId: true },
        });
        let narrativeData = null;
        if (session.clinicalNarrativeEncrypted && session.narrativeIV && session.narrativeKeyId) {
            if (permissions.canViewNarrative && options.includeNarrative) {
                try {
                    narrativeData = await this.cryptoService.decryptClinicalNarrative({
                        encrypted: session.clinicalNarrativeEncrypted,
                        iv: session.narrativeIV,
                        keyId: session.narrativeKeyId,
                    }, sessionId, actor.id);
                }
                catch {
                    narrativeData = this.masked(export_interfaces_1.MaskReason.REDACTED, '[Error de descifrado]');
                }
            }
            else {
                narrativeData = this.masked(export_interfaces_1.MaskReason.INSUFFICIENT_PERMISSIONS, '[Narrativa protegida]');
            }
        }
        const sessionData = {
            sessionId: session.id,
            appointmentId: session.appointmentId,
            patient: {
                id: session.patientId,
                name: permissions.canViewPatientPII
                    ? `${session.patient.firstName} ${session.patient.lastName}`
                    : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Nombre protegido]'),
                dateOfBirth: permissions.canViewPatientPII
                    ? session.patient.dateOfBirth?.toISOString().split('T')[0]
                    : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Fecha protegida]'),
            },
            therapist: {
                id: session.therapist.id,
                name: `${session.therapist.firstName} ${session.therapist.lastName}`,
            },
            startedAt: session.startedAt.toISOString(),
            endedAt: session.endedAt?.toISOString() || null,
            durationMinutes: session.durationMinutes,
            clinicalNarrative: narrativeData,
            isDraft: session.isDraft,
            isLocked: session.isLocked,
            signedAt: session.signedAt?.toISOString() || null,
            signatureHash: session.signatureHash,
            hasShadowNote: !!shadowNote,
            shadowNoteAccess: shadowNote?.therapistId === actor.id ? 'OWNER_ONLY' : 'NONE',
        };
        const exportDoc = this.buildExportDocument({ session: sessionData }, actor, options);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.EXPORT,
            resource: client_1.AuditResource.CLINICAL_SESSION,
            resourceId: sessionId,
            patientId: session.patientId,
            success: true,
            details: {
                format: options.format,
                includeNarrative: options.includeNarrative,
                maskPII: options.maskPII || !permissions.canViewPatientPII,
                integrityHash: exportDoc.integrity.hash.substring(0, 16) + '...',
            },
        });
        this.logger.log(`Session exported: ${sessionId} by ${actor.id}`);
        return exportDoc;
    }
    async exportPatientHistory(patientId, actor, options) {
        const permissions = this.getPermissions(actor.globalRole);
        if (!permissions.canExportBulk) {
            await this.auditExportDenied(actor, 'PATIENT', patientId, 'No bulk export permission');
            throw new common_1.ForbiddenException('No tiene permisos para exportación masiva');
        }
        const hasAccess = await this.verifyPatientAccess(actor, patientId);
        if (!hasAccess && actor.globalRole !== client_1.GlobalRole.AUDITOR) {
            await this.auditExportDenied(actor, 'PATIENT', patientId, 'No patient collaboration');
            throw new common_1.ForbiddenException('No tiene acceso a este paciente');
        }
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException('Paciente no encontrado');
        }
        const appointments = await this.prisma.appointment.findMany({
            where: { patientId, deletedAt: null },
            include: { session: { select: { id: true } } },
            orderBy: { scheduledStart: 'desc' },
        });
        const patientData = {
            id: patient.id,
            externalId: permissions.canViewPatientPII
                ? patient.externalId
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[ID protegido]'),
            firstName: permissions.canViewPatientPII
                ? patient.firstName
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Nombre protegido]'),
            lastName: permissions.canViewPatientPII
                ? patient.lastName
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Apellido protegido]'),
            dateOfBirth: permissions.canViewPatientPII
                ? patient.dateOfBirth?.toISOString().split('T')[0] || ''
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Fecha protegida]'),
            gender: permissions.canViewPatientPII
                ? patient.gender || ''
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Género protegido]'),
            contactPhone: permissions.canViewPatientPII
                ? patient.contactPhone || ''
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Teléfono protegido]'),
            contactEmail: permissions.canViewPatientPII
                ? patient.contactEmail || ''
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Email protegido]'),
            emergencyContact: permissions.canViewPatientPII
                ? patient.emergencyContactName || ''
                : this.masked(export_interfaces_1.MaskReason.PRIVACY_PROTECTION, '[Contacto protegido]'),
            createdAt: patient.createdAt.toISOString(),
        };
        const appointmentsData = appointments.map((apt) => ({
            id: apt.id,
            scheduledStart: apt.scheduledStart.toISOString(),
            scheduledEnd: apt.scheduledEnd.toISOString(),
            status: apt.status,
            sessionType: apt.sessionType,
            hasSession: !!apt.session,
        }));
        const exportDoc = this.buildExportDocument({
            patient: patientData,
            appointments: appointmentsData,
        }, actor, options);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.EXPORT,
            resource: client_1.AuditResource.PATIENT,
            resourceId: patientId,
            patientId,
            success: true,
            details: {
                format: options.format,
                appointmentsCount: appointments.length,
                maskPII: !permissions.canViewPatientPII,
            },
        });
        return exportDoc;
    }
    generatePdfStructure(doc) {
        return {
            header: {
                title: 'Syntegra Clinical OS - Reporte Clínico',
                subtitle: `Exportado: ${doc.metadata.exportedAt}`,
                logo: 'syntegra-logo.png',
                classification: doc.metadata.classification,
            },
            footer: {
                generatedBy: doc.metadata.exportedBy.name,
                role: doc.metadata.exportedBy.role,
                integrity: `Hash: ${doc.integrity.hash.substring(0, 32)}...`,
                page: '{{page}} de {{pages}}',
            },
            sections: this.buildPdfSections(doc),
            watermark: doc.metadata.classification === export_interfaces_1.DataClassification.RESTRICTED
                ? 'CONFIDENCIAL - USO CLÍNICO'
                : undefined,
        };
    }
    buildPdfSections(doc) {
        const sections = [];
        sections.push({
            title: 'Información del Documento',
            type: 'metadata',
            content: [
                { label: 'ID de Documento', value: doc.metadata.documentId },
                { label: 'Fecha de Exportación', value: doc.metadata.exportedAt },
                { label: 'Exportado por', value: doc.metadata.exportedBy.name },
                { label: 'Clasificación', value: doc.metadata.classification },
            ],
        });
        if (doc.content.session) {
            const s = doc.content.session;
            sections.push({
                title: 'Sesión Clínica',
                type: 'session',
                content: [
                    { label: 'ID de Sesión', value: s.sessionId },
                    { label: 'Paciente', value: this.renderField(s.patient.name) },
                    { label: 'Terapeuta', value: s.therapist.name },
                    { label: 'Inicio', value: s.startedAt },
                    { label: 'Fin', value: s.endedAt || 'En progreso' },
                    { label: 'Duración', value: s.durationMinutes ? `${s.durationMinutes} min` : 'N/A' },
                    { label: 'Estado', value: s.isLocked ? 'Firmada' : s.isDraft ? 'Borrador' : 'Pendiente firma' },
                ],
            });
            if (s.clinicalNarrative && !this.isMasked(s.clinicalNarrative)) {
                const n = s.clinicalNarrative;
                sections.push({
                    title: 'Narrativa Clínica (SOAP)',
                    type: 'narrative',
                    content: [
                        { label: 'Subjetivo', value: n.subjectiveReport || 'N/A' },
                        { label: 'Objetivo', value: n.objectiveObservation || 'N/A' },
                        { label: 'Evaluación', value: n.assessment || 'N/A' },
                        { label: 'Plan', value: n.plan || 'N/A' },
                    ],
                });
            }
            else if (s.clinicalNarrative) {
                sections.push({
                    title: 'Narrativa Clínica',
                    type: 'masked',
                    content: [
                        { label: 'Estado', value: this.renderField(s.clinicalNarrative) },
                    ],
                });
            }
            if (s.hasShadowNote) {
                sections.push({
                    title: 'Nota Sombra',
                    type: 'info',
                    content: [
                        {
                            label: 'Estado',
                            value: s.shadowNoteAccess === 'OWNER_ONLY'
                                ? 'Existe - Solo accesible por el propietario'
                                : 'Existe - Sin acceso',
                        },
                    ],
                });
            }
        }
        if (doc.content.patient) {
            const p = doc.content.patient;
            sections.push({
                title: 'Información del Paciente',
                type: 'patient',
                content: [
                    { label: 'ID', value: p.id },
                    { label: 'ID Externo', value: this.renderField(p.externalId) },
                    { label: 'Nombre', value: this.renderField(p.firstName) },
                    { label: 'Apellido', value: this.renderField(p.lastName) },
                    { label: 'Fecha de Nacimiento', value: this.renderField(p.dateOfBirth) },
                    { label: 'Teléfono', value: this.renderField(p.contactPhone) },
                    { label: 'Email', value: this.renderField(p.contactEmail) },
                ],
            });
        }
        sections.push({
            title: 'Verificación de Integridad',
            type: 'integrity',
            content: [
                { label: 'Algoritmo', value: doc.integrity.algorithm },
                { label: 'Hash', value: doc.integrity.hash },
                { label: 'Generado', value: doc.integrity.generatedAt },
            ],
        });
        return sections;
    }
    getPermissions(role) {
        return export_interfaces_1.EXPORT_PERMISSIONS[role] || export_interfaces_1.EXPORT_PERMISSIONS[client_1.GlobalRole.ASISTENTE];
    }
    async verifyPatientAccess(actor, patientId) {
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(actor.id, patientId);
        return !!collaboration;
    }
    masked(reason, placeholder) {
        return {
            _masked: true,
            reason,
            placeholder,
        };
    }
    isMasked(field) {
        return field && typeof field === 'object' && field._masked === true;
    }
    renderField(field) {
        if (this.isMasked(field)) {
            return field.placeholder;
        }
        return field;
    }
    buildExportDocument(content, actor, options) {
        const documentId = crypto.randomUUID();
        const exportedAt = new Date().toISOString();
        const contentString = JSON.stringify(content);
        const hash = crypto.createHash('sha256').update(contentString).digest('hex');
        return {
            metadata: {
                documentId,
                exportedAt,
                exportedBy: {
                    userId: actor.id,
                    name: `${actor.firstName} ${actor.lastName}`,
                    role: actor.globalRole,
                },
                format: options.format,
                version: '1.0',
                classification: export_interfaces_1.DataClassification.RESTRICTED,
            },
            content,
            integrity: {
                hash,
                algorithm: 'SHA-256',
                generatedAt: exportedAt,
            },
        };
    }
    async auditExportDenied(actor, resourceType, resourceId, reason) {
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.EXPORT,
            resource: resourceType === 'SESSION'
                ? client_1.AuditResource.CLINICAL_SESSION
                : client_1.AuditResource.PATIENT,
            resourceId,
            success: false,
            failureReason: reason,
        });
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = ExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        crypto_service_1.CryptoService,
        audit_service_1.AuditService,
        collaborations_repository_1.CollaborationsRepository])
], ExportService);
//# sourceMappingURL=export.service.js.map