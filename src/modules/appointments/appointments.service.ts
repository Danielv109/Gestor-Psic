// src/modules/appointments/appointments.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { AppointmentsRepository } from './appointments.repository';
import { CollaborationsRepository } from '../collaborations/collaborations.repository';
import { AuditService } from '../audit/audit.service';
import { CreateAppointmentDto, UpdateAppointmentDto, CancelAppointmentDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuditAction, AuditResource, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
    constructor(
        private readonly appointmentsRepo: AppointmentsRepository,
        private readonly collaborationsRepo: CollaborationsRepository,
        private readonly auditService: AuditService,
    ) { }

    async create(dto: CreateAppointmentDto, actor: AuthenticatedUser) {
        // Verificar que el terapeuta tiene acceso al paciente
        const hasAccess = await this.collaborationsRepo.findActiveCollaboration(
            actor.id,
            dto.patientId,
        );

        if (!hasAccess) {
            throw new BadRequestException('No tienes acceso a este paciente');
        }

        const startTime = new Date(dto.scheduledStart);
        const endTime = new Date(dto.scheduledEnd);

        // Validar que el horario es válido
        if (startTime >= endTime) {
            throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
        }

        // Verificar conflictos de horario
        const hasConflict = await this.appointmentsRepo.hasConflict(
            dto.patientId,
            startTime,
            endTime,
        );

        if (hasConflict) {
            throw new ConflictException('El paciente ya tiene una cita en ese horario');
        }

        const appointment = await this.appointmentsRepo.create({
            patient: { connect: { id: dto.patientId } },
            therapist: { connect: { id: actor.id } },
            scheduledStart: startTime,
            scheduledEnd: endTime,
            sessionType: dto.sessionType,
            adminNotes: dto.adminNotes,
        });

        // Auditoría: CREATE
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.APPOINTMENT,
            resourceId: appointment.id,
            patientId: dto.patientId,
            success: true,
        });

        return appointment;
    }

    async findById(id: string, actor: AuthenticatedUser) {
        const appointment = await this.appointmentsRepo.findById(id);

        if (!appointment) {
            throw new NotFoundException(`Cita ${id} no encontrada`);
        }

        // Auditoría: READ
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: appointment.patientId,
            success: true,
        });

        return appointment;
    }

    async findMyUpcoming(actor: AuthenticatedUser) {
        const appointments = await this.appointmentsRepo.findUpcoming(actor.id);

        // Auditoría: READ (lista)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.APPOINTMENT,
            resourceId: actor.id,
            success: true,
            details: { count: appointments.length, type: 'upcoming' },
        });

        return appointments;
    }

    async findByDateRange(
        startDate: string,
        endDate: string,
        actor: AuthenticatedUser,
    ) {
        const appointments = await this.appointmentsRepo.findByDateRange(
            actor.id,
            new Date(startDate),
            new Date(endDate),
        );

        // Auditoría: READ (lista)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.READ,
            resource: AuditResource.APPOINTMENT,
            resourceId: actor.id,
            success: true,
            details: { count: appointments.length, type: 'dateRange', startDate, endDate },
        });

        return appointments;
    }

    async update(id: string, dto: UpdateAppointmentDto, actor: AuthenticatedUser) {
        const existing = await this.appointmentsRepo.findById(id);

        if (!existing) {
            throw new NotFoundException(`Cita ${id} no encontrada`);
        }

        // No permitir modificar citas completadas o canceladas
        if (
            existing.status === AppointmentStatus.COMPLETED ||
            existing.status === AppointmentStatus.CANCELLED
        ) {
            throw new BadRequestException('No se puede modificar una cita completada o cancelada');
        }

        const startTime = dto.scheduledStart ? new Date(dto.scheduledStart) : undefined;
        const endTime = dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined;

        // Si cambian horarios, verificar conflictos
        if (startTime && endTime) {
            const hasConflict = await this.appointmentsRepo.hasConflict(
                existing.patientId,
                startTime,
                endTime,
                id,
            );

            if (hasConflict) {
                throw new ConflictException('El paciente ya tiene una cita en ese horario');
            }
        }

        const updated = await this.appointmentsRepo.update(id, {
            scheduledStart: startTime,
            scheduledEnd: endTime,
            sessionType: dto.sessionType,
            adminNotes: dto.adminNotes,
            status: dto.status,
        });

        // Auditoría: UPDATE
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { updatedFields: Object.keys(dto) },
        });

        return updated;
    }

    async cancel(id: string, dto: CancelAppointmentDto, actor: AuthenticatedUser) {
        const existing = await this.appointmentsRepo.findById(id);

        if (!existing) {
            throw new NotFoundException(`Cita ${id} no encontrada`);
        }

        if (existing.status === AppointmentStatus.CANCELLED) {
            throw new BadRequestException('La cita ya está cancelada');
        }

        const cancelled = await this.appointmentsRepo.cancel(id, dto.cancelReason);

        // Auditoría: UPDATE (cancelación)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { action: 'cancel', reason: dto.cancelReason },
        });

        return cancelled;
    }

    async confirm(id: string, actor: AuthenticatedUser) {
        const existing = await this.appointmentsRepo.findById(id);

        if (!existing) {
            throw new NotFoundException(`Cita ${id} no encontrada`);
        }

        if (existing.status !== AppointmentStatus.SCHEDULED) {
            throw new BadRequestException('Solo se pueden confirmar citas programadas');
        }

        const confirmed = await this.appointmentsRepo.confirm(id);

        // Auditoría: UPDATE (confirmación)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.UPDATE,
            resource: AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { action: 'confirm' },
        });

        return confirmed;
    }

    async softDelete(id: string, actor: AuthenticatedUser) {
        const existing = await this.appointmentsRepo.findById(id);

        if (!existing) {
            throw new NotFoundException(`Cita ${id} no encontrada`);
        }

        await this.appointmentsRepo.softDelete(id);

        // Auditoría: DELETE (soft)
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: AuditAction.DELETE,
            resource: AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { softDelete: true },
        });
    }
}
