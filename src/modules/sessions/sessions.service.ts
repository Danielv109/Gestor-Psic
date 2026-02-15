// src/modules/sessions/sessions.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { SessionsRepository } from './sessions.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import {
    CreateSessionDto,
    UpdateSessionDto,
    SignSessionDto,
    ClinicalNarrativeDto,
} from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
    AuditAction,
    AuditResource,
    AppointmentStatus,
    ClinicalSession,
} from '@prisma/client';
import {
    ClinicalNarrative,
    DecryptionError,
} from '../../crypto/interfaces/crypto.interfaces';

@Injectable()
export class SessionsService {
    constructor(
        private readonly sessionsRepo: SessionsRepository,
        private readonly appointmentsRepo: AppointmentsRepository,
        private readonly cryptoService: CryptoService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Crear nueva sesión clínica
     */
    async create(dto: CreateSessionDto, actor: AuthenticatedUser) {
        // Verificar que la cita existe
        const appointment = await this.appointmentsRepo.findById(dto.appointmentId);

        if (!appointment) {
            throw new NotFoundException('Cita no encontrada');
        }

        // Verificar que no existe sesión para esta cita
        const existingSession = await this.sessionsRepo.findByAppointment(
            dto.appointmentId,
        );

        if (existingSession) {
            throw new ConflictException('Ya existe una sesión para esta cita');
        }

        // Cifrar narrativa si existe
        let encryptedPayload: {
            encrypted: Buffer;
            iv: Buffer;
            keyId: string;
        } | null = null;

        if (dto.clinicalNarrative) {
            encryptedPayload = await this.cryptoService.encryptClinicalNarrative(
                dto.clinicalNarrative as ClinicalNarrative,
            );
        }

        // Actualizar estado de la cita
        await this.appointmentsRepo.update(dto.appointmentId, {
            status: AppointmentStatus.IN_PROGRESS,
        });

        const session = await this.sessionsRepo.create({
            appointment: { connect: { id: dto.appointmentId } },
            patient: { connect: { id: appointment.patientId } },
            therapist: { connect: { id: actor.id } },
            startedAt: new Date(dto.startedAt),
            clinicalNarrativeEncrypted: encryptedPayload?.encrypted,
            narrativeIV: encryptedPayload?.iv,
            narrativeKeyId: encryptedPayload?.keyId,
            isDraft: true,
            isLocked: false,
        });

        // Auditoría: CREATE
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: session.id,
            patientId: appointment.patientId,
            success: true,
        });

        return this.sanitizeSession(session);
    }

    /**
     * Obtener sesión por ID con narrativa descifrada
     */
    async findById(id: string, actor: AuthenticatedUser) {
        const session = await this.sessionsRepo.findById(id);

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        // Auditoría: READ
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
        });

        // Descifrar narrativa
        const decryptedNarrative = await this.safeDecryptNarrative(session, actor.id);

        // Auditoría: DECRYPT (si había narrativa)
        if (decryptedNarrative) {
            await this.auditService.log({
                actorId: actor.id,
                actorRole: actor.globalRole,
                actorIp: actor.ip,
                action: AuditAction.DECRYPT,
                resource: AuditResource.CLINICAL_SESSION,
                resourceId: id,
                patientId: session.patientId,
                success: true,
            });
        }

        return {
            ...this.sanitizeSession(session),
            clinicalNarrative: decryptedNarrative,
        };
    }

    /**
     * Listar sesiones del terapeuta
     */
    async findByTherapist(actor: AuthenticatedUser, isDraft?: boolean) {
        const sessions = await this.sessionsRepo.findByTherapist(actor.id, {
            isDraft,
        });

        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: actor.id,
            success: true,
            details: { count: sessions.length, type: 'list', isDraft },
        });

        return sessions.map((s) => this.sanitizeSession(s));
    }

    /**
     * Historial de sesiones de un paciente
     */
    async findByPatient(patientId: string, actor: AuthenticatedUser) {
        const sessions = await this.sessionsRepo.findByPatient(patientId);

        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: patientId,
            patientId,
            success: true,
            details: { count: sessions.length, type: 'patientHistory' },
        });

        return sessions.map((s) => this.sanitizeSession(s));
    }

    /**
     * Actualizar sesión (solo si no está firmada)
     */
    async update(id: string, dto: UpdateSessionDto, actor: AuthenticatedUser) {
        const session = await this.sessionsRepo.findById(id);

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        // REGLA CRÍTICA: Sesiones firmadas NO pueden editarse
        if (session.isLocked || session.signedAt) {
            throw new ForbiddenException('Las sesiones firmadas no pueden editarse');
        }

        // Solo el terapeuta de la sesión puede editar
        if (session.therapistId !== actor.id) {
            throw new ForbiddenException(
                'Solo el terapeuta de la sesión puede editarla',
            );
        }

        // Crear versión antes de actualizar (si hay narrativa existente)
        if (session.clinicalNarrativeEncrypted && session.narrativeIV) {
            const versionCount = await this.sessionsRepo.getVersionCount(id);

            await this.sessionsRepo.createVersion({
                sessionId: id,
                versionNumber: versionCount + 1,
                narrativeSnapshotEncrypted: session.clinicalNarrativeEncrypted,
                narrativeIV: session.narrativeIV,
                narrativeKeyId: session.narrativeKeyId!,
                changedBy: actor.id,
                changeReason: dto.changeReason,
            });
        }

        // Cifrar nueva narrativa con clave activa
        let encryptedPayload: {
            encrypted: Buffer;
            iv: Buffer;
            keyId: string;
        } | null = null;

        if (dto.clinicalNarrative) {
            encryptedPayload = await this.cryptoService.encryptClinicalNarrative(
                dto.clinicalNarrative as ClinicalNarrative,
            );
        }

        const updated = await this.sessionsRepo.update(id, {
            endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
            durationMinutes: dto.endedAt
                ? this.calculateDuration(session.startedAt, new Date(dto.endedAt))
                : undefined,
            clinicalNarrativeEncrypted: encryptedPayload?.encrypted,
            narrativeIV: encryptedPayload?.iv,
            narrativeKeyId: encryptedPayload?.keyId,
        });

        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: { changeReason: dto.changeReason, newKeyId: encryptedPayload?.keyId },
        });

        return this.sanitizeSession(updated);
    }

    /**
     * Firmar sesión (la bloquea permanentemente)
     */
    async sign(id: string, dto: SignSessionDto, actor: AuthenticatedUser) {
        const session = await this.sessionsRepo.findById(id);

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        if (session.isLocked || session.signedAt) {
            throw new ConflictException('La sesión ya está firmada');
        }

        if (session.therapistId !== actor.id) {
            throw new ForbiddenException(
                'Solo el terapeuta de la sesión puede firmarla',
            );
        }

        if (session.isDraft && !session.clinicalNarrativeEncrypted) {
            throw new BadRequestException(
                'No se puede firmar una sesión sin narrativa clínica',
            );
        }

        // Generar hash de firma usando CryptoService
        const signatureHash = this.cryptoService.generateSessionSignature(
            id,
            actor.id,
            new Date(),
        );

        // Actualizar cita a completada
        await this.appointmentsRepo.update(session.appointmentId, {
            status: AppointmentStatus.COMPLETED,
        });

        const signed = await this.sessionsRepo.sign(id, signatureHash);

        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: {
                action: 'sign',
                signatureHash: signatureHash.substring(0, 16) + '...',
            },
        });

        return this.sanitizeSession(signed);
    }

    /**
     * Obtener historial de versiones con narrativa descifrada
     */
    async getVersions(id: string, actor: AuthenticatedUser) {
        const session = await this.sessionsRepo.findById(id);

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        const versions = await this.sessionsRepo.getVersions(id);

        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: { type: 'versions', count: versions.length },
        });

        // Decrypt each version's narrative for human-readable history
        const decryptedVersions = await Promise.all(
            versions.map(async (v) => {
                let narrativeText: string | null = null;
                try {
                    if (v.narrativeSnapshotEncrypted && v.narrativeIV && v.narrativeKeyId) {
                        const payload = {
                            encrypted: Buffer.from(v.narrativeSnapshotEncrypted),
                            iv: Buffer.from(v.narrativeIV),
                            keyId: v.narrativeKeyId,
                        };
                        const parsed = await this.cryptoService.decryptClinicalNarrative(
                            payload,
                            v.sessionId,
                            actor.id,
                        );
                        narrativeText = [
                            parsed.subjectiveReport ? `Subjetivo: ${parsed.subjectiveReport}` : '',
                            parsed.objectiveObservation ? `Observaciones: ${parsed.objectiveObservation}` : '',
                            parsed.assessment ? `Evaluación: ${parsed.assessment}` : '',
                            parsed.plan ? `Plan: ${parsed.plan}` : '',
                            parsed.additionalNotes ? `Notas: ${parsed.additionalNotes}` : '',
                        ].filter(Boolean).join('\n\n');
                    }
                } catch {
                    narrativeText = '[No se pudo descifrar esta versión]';
                }

                return {
                    id: v.id,
                    versionNumber: v.versionNumber,
                    createdAt: v.createdAt,
                    changeReason: v.changeReason,
                    narrativeText,
                };
            }),
        );

        return decryptedVersions;
    }

    /**
     * Re-cifrar sesión con clave nueva (post-rotación)
     */
    async reEncryptSession(id: string, actor: AuthenticatedUser) {
        const session = await this.sessionsRepo.findById(id);

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        if (!session.clinicalNarrativeEncrypted || !session.narrativeIV) {
            throw new BadRequestException('La sesión no tiene narrativa cifrada');
        }

        // Re-cifrar usando CryptoService
        const newPayload = await this.cryptoService.reEncryptClinicalNarrative(
            {
                encrypted: session.clinicalNarrativeEncrypted,
                iv: session.narrativeIV,
                keyId: session.narrativeKeyId!,
            },
            id,
            actor.id,
        );

        // Actualizar con nueva clave
        await this.sessionsRepo.update(id, {
            clinicalNarrativeEncrypted: newPayload.encrypted,
            narrativeIV: newPayload.iv,
            narrativeKeyId: newPayload.keyId,
        });

        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.CLINICAL_SESSION,
            resourceId: id,
            patientId: session.patientId,
            success: true,
            details: {
                action: 'reEncrypt',
                oldKeyId: session.narrativeKeyId,
                newKeyId: newPayload.keyId,
            },
        });

        return { success: true, newKeyId: newPayload.keyId };
    }

    /**
     * Descifrar narrativa de forma segura con manejo de errores
     */
    private async safeDecryptNarrative(
        session: ClinicalSession,
        actorId: string,
    ): Promise<ClinicalNarrative | null> {
        if (
            !session.clinicalNarrativeEncrypted ||
            !session.narrativeIV ||
            !session.narrativeKeyId
        ) {
            return null;
        }

        try {
            return await this.cryptoService.decryptClinicalNarrative(
                {
                    encrypted: session.clinicalNarrativeEncrypted,
                    iv: session.narrativeIV,
                    keyId: session.narrativeKeyId,
                },
                session.id,
                actorId,
            );
        } catch (error) {
            if (error instanceof DecryptionError) {
                // Error ya fue auditado por CryptoService
                throw new BadRequestException(
                    `Error al descifrar narrativa: ${error.reason}`,
                );
            }
            throw error;
        }
    }

    /**
     * Eliminar datos sensibles del response
     */
    private sanitizeSession(session: any) {
        const {
            clinicalNarrativeEncrypted,
            narrativeIV,
            narrativeKeyId,
            ...safe
        } = session;
        return safe;
    }

    private calculateDuration(start: Date, end: Date): number {
        return Math.round((end.getTime() - start.getTime()) / 60000);
    }
}
