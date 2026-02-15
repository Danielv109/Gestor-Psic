// src/modules/export/export.service.ts
import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { CollaborationsRepository } from '../collaborations/collaborations.repository';
import {
    ExportDocument,
    ExportFormat,
    ExportOptions,
    ExportPermissions,
    EXPORT_PERMISSIONS,
    SessionExportData,
    PatientExportData,
    MaskedField,
    MaskReason,
    DataClassification,
    ClinicalNarrativeExport,
    PdfDocumentStructure,
    PdfSection,
} from './interfaces/export.interfaces';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditAction, AuditResource, GlobalRole } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * ExportService
 * 
 * Exportación segura de datos clínicos con:
 * - Verificación ABAC
 * - Enmascaramiento según permisos
 * - Auditoría completa
 * - Hash de integridad
 */
@Injectable()
export class ExportService {
    private readonly logger = new Logger(ExportService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cryptoService: CryptoService,
        private readonly auditService: AuditService,
        private readonly collaborationsRepo: CollaborationsRepository,
    ) { }

    // ============================================================
    // SESSION EXPORT
    // ============================================================

    /**
     * Exportar sesión clínica
     */
    async exportSession(
        sessionId: string,
        actor: AuthenticatedUser,
        options: ExportOptions,
    ): Promise<ExportDocument> {
        // Verificar permisos de rol
        const permissions = this.getPermissions(actor.globalRole);

        if (!permissions.canExportSessions) {
            await this.auditExportDenied(actor, 'SESSION', sessionId, 'No export permission');
            throw new ForbiddenException('No tiene permisos para exportar sesiones');
        }

        // Obtener sesión con relaciones
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
            throw new NotFoundException('Sesión no encontrada');
        }

        // Verificar acceso ABAC (colaboración con el paciente)
        const hasAccess = await this.verifyPatientAccess(actor, session.patientId);

        if (!hasAccess && actor.globalRole !== GlobalRole.AUDITOR) {
            await this.auditExportDenied(actor, 'SESSION', sessionId, 'No patient collaboration');
            throw new ForbiddenException('No tiene acceso a este paciente');
        }

        // Verificar shadow note (solo indicar existencia, nunca exportar para no-propietarios)
        const shadowNote = await this.prisma.shadowNote.findUnique({
            where: { sessionId },
            select: { id: true, therapistId: true },
        });

        // Descifrar narrativa si tiene permisos
        let narrativeData: ClinicalNarrativeExport | MaskedField | null = null;

        if (session.clinicalNarrativeEncrypted && session.narrativeIV && session.narrativeKeyId) {
            if (permissions.canViewNarrative && options.includeNarrative) {
                try {
                    narrativeData = await this.cryptoService.decryptClinicalNarrative(
                        {
                            encrypted: session.clinicalNarrativeEncrypted,
                            iv: session.narrativeIV,
                            keyId: session.narrativeKeyId,
                        },
                        sessionId,
                        actor.id,
                    );
                } catch {
                    narrativeData = this.masked(MaskReason.REDACTED, '[Error de descifrado]');
                }
            } else {
                narrativeData = this.masked(
                    MaskReason.INSUFFICIENT_PERMISSIONS,
                    '[Narrativa protegida]',
                );
            }
        }

        // Construir datos de sesión con enmascaramiento
        const sessionData: SessionExportData = {
            sessionId: session.id,
            appointmentId: session.appointmentId,
            patient: {
                id: session.patientId,
                name: permissions.canViewPatientPII
                    ? `${session.patient.firstName} ${session.patient.lastName}`
                    : this.masked(MaskReason.PRIVACY_PROTECTION, '[Nombre protegido]'),
                dateOfBirth: permissions.canViewPatientPII
                    ? session.patient.dateOfBirth?.toISOString().split('T')[0]
                    : this.masked(MaskReason.PRIVACY_PROTECTION, '[Fecha protegida]'),
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

        // Construir documento de exportación
        const exportDoc = this.buildExportDocument(
            { session: sessionData },
            actor,
            options,
        );

        // Auditar exportación exitosa
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.EXPORT,
            resource: AuditResource.CLINICAL_SESSION,
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

    /**
     * Exportar historial de paciente
     */
    async exportPatientHistory(
        patientId: string,
        actor: AuthenticatedUser,
        options: ExportOptions,
    ): Promise<ExportDocument> {
        const permissions = this.getPermissions(actor.globalRole);

        if (!permissions.canExportBulk) {
            await this.auditExportDenied(actor, 'PATIENT', patientId, 'No bulk export permission');
            throw new ForbiddenException('No tiene permisos para exportación masiva');
        }

        // Verificar acceso ABAC
        const hasAccess = await this.verifyPatientAccess(actor, patientId);

        if (!hasAccess && actor.globalRole !== GlobalRole.AUDITOR) {
            await this.auditExportDenied(actor, 'PATIENT', patientId, 'No patient collaboration');
            throw new ForbiddenException('No tiene acceso a este paciente');
        }

        // Obtener paciente
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
        });

        if (!patient) {
            throw new NotFoundException('Paciente no encontrado');
        }

        // Obtener citas
        const appointments = await this.prisma.appointment.findMany({
            where: { patientId, deletedAt: null },
            include: { session: { select: { id: true } } },
            orderBy: { scheduledStart: 'desc' },
        });

        // Construir datos de paciente con enmascaramiento
        const patientData: PatientExportData = {
            id: patient.id,
            externalId: permissions.canViewPatientPII
                ? patient.externalId
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[ID protegido]'),
            firstName: permissions.canViewPatientPII
                ? patient.firstName
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Nombre protegido]'),
            lastName: permissions.canViewPatientPII
                ? patient.lastName
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Apellido protegido]'),
            dateOfBirth: permissions.canViewPatientPII
                ? patient.dateOfBirth?.toISOString().split('T')[0] || ''
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Fecha protegida]'),
            gender: permissions.canViewPatientPII
                ? patient.gender || ''
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Género protegido]'),
            contactPhone: permissions.canViewPatientPII
                ? patient.contactPhone || ''
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Teléfono protegido]'),
            contactEmail: permissions.canViewPatientPII
                ? patient.contactEmail || ''
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Email protegido]'),
            emergencyContact: permissions.canViewPatientPII
                ? patient.emergencyContactName || ''
                : this.masked(MaskReason.PRIVACY_PROTECTION, '[Contacto protegido]'),
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

        const exportDoc = this.buildExportDocument(
            {
                patient: patientData,
                appointments: appointmentsData,
            },
            actor,
            options,
        );

        // Auditar
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.EXPORT,
            resource: AuditResource.PATIENT,
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

    // ============================================================
    // PDF STRUCTURE (para generador externo)
    // ============================================================

    /**
     * Generar estructura para PDF
     */
    generatePdfStructure(doc: ExportDocument): PdfDocumentStructure {
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
            watermark:
                doc.metadata.classification === DataClassification.RESTRICTED
                    ? 'CONFIDENCIAL - USO CLÍNICO'
                    : undefined,
        };
    }

    private buildPdfSections(doc: ExportDocument): PdfSection[] {
        const sections: PdfSection[] = [];

        // Sección de metadatos
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

        // Sección de sesión
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

            // Narrativa clínica
            if (s.clinicalNarrative && !this.isMasked(s.clinicalNarrative)) {
                const n = s.clinicalNarrative as ClinicalNarrativeExport;
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
            } else if (s.clinicalNarrative) {
                sections.push({
                    title: 'Narrativa Clínica',
                    type: 'masked',
                    content: [
                        { label: 'Estado', value: this.renderField(s.clinicalNarrative) },
                    ],
                });
            }

            // Nota sobre shadow notes
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

        // Sección de paciente
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

        // Integridad
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

    // ============================================================
    // HELPERS
    // ============================================================

    private getPermissions(role: GlobalRole): ExportPermissions {
        return EXPORT_PERMISSIONS[role] || EXPORT_PERMISSIONS[GlobalRole.ASISTENTE];
    }

    private async verifyPatientAccess(
        actor: AuthenticatedUser,
        patientId: string,
    ): Promise<boolean> {
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(
            actor.id,
            patientId,
        );
        return !!collaboration;
    }

    private masked(reason: MaskReason, placeholder: string): MaskedField {
        return {
            _masked: true,
            reason,
            placeholder,
        };
    }

    private isMasked(field: any): field is MaskedField {
        return field && typeof field === 'object' && field._masked === true;
    }

    private renderField(field: string | MaskedField): string {
        if (this.isMasked(field)) {
            return field.placeholder;
        }
        return field;
    }

    private buildExportDocument(
        content: ExportDocument['content'],
        actor: AuthenticatedUser,
        options: ExportOptions,
    ): ExportDocument {
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
                classification: DataClassification.RESTRICTED,
            },
            content,
            integrity: {
                hash,
                algorithm: 'SHA-256',
                generatedAt: exportedAt,
            },
        };
    }

    private async auditExportDenied(
        actor: AuthenticatedUser,
        resourceType: string,
        resourceId: string,
        reason: string,
    ) {
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.EXPORT,
            resource: resourceType === 'SESSION'
                ? AuditResource.CLINICAL_SESSION
                : AuditResource.PATIENT,
            resourceId,
            success: false,
            failureReason: reason,
        });
    }
}


