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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const appointments_repository_1 = require("./appointments.repository");
const collaborations_repository_1 = require("../collaborations/collaborations.repository");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let AppointmentsService = class AppointmentsService {
    constructor(appointmentsRepo, collaborationsRepo, auditService) {
        this.appointmentsRepo = appointmentsRepo;
        this.collaborationsRepo = collaborationsRepo;
        this.auditService = auditService;
    }
    async create(dto, actor) {
        const hasAccess = await this.collaborationsRepo.findActiveCollaboration(actor.id, dto.patientId);
        if (!hasAccess) {
            throw new common_1.BadRequestException('No tienes acceso a este paciente');
        }
        const startTime = new Date(dto.scheduledStart);
        const endTime = new Date(dto.scheduledEnd);
        if (startTime >= endTime) {
            throw new common_1.BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
        }
        const hasConflict = await this.appointmentsRepo.hasConflict(dto.patientId, startTime, endTime);
        if (hasConflict) {
            throw new common_1.ConflictException('El paciente ya tiene una cita en ese horario');
        }
        const appointment = await this.appointmentsRepo.create({
            patient: { connect: { id: dto.patientId } },
            therapist: { connect: { id: actor.id } },
            scheduledStart: startTime,
            scheduledEnd: endTime,
            sessionType: dto.sessionType,
            adminNotes: dto.adminNotes,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: appointment.id,
            patientId: dto.patientId,
            success: true,
        });
        return appointment;
    }
    async findById(id, actor) {
        const appointment = await this.appointmentsRepo.findById(id);
        if (!appointment) {
            throw new common_1.NotFoundException(`Cita ${id} no encontrada`);
        }
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: appointment.patientId,
            success: true,
        });
        return appointment;
    }
    async findMyUpcoming(actor) {
        const appointments = await this.appointmentsRepo.findUpcoming(actor.id);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: actor.id,
            success: true,
            details: { count: appointments.length, type: 'upcoming' },
        });
        return appointments;
    }
    async findByDateRange(startDate, endDate, actor) {
        const appointments = await this.appointmentsRepo.findByDateRange(actor.id, new Date(startDate), new Date(endDate));
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.READ,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: actor.id,
            success: true,
            details: { count: appointments.length, type: 'dateRange', startDate, endDate },
        });
        return appointments;
    }
    async update(id, dto, actor) {
        const existing = await this.appointmentsRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Cita ${id} no encontrada`);
        }
        if (existing.status === client_1.AppointmentStatus.COMPLETED ||
            existing.status === client_1.AppointmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('No se puede modificar una cita completada o cancelada');
        }
        const startTime = dto.scheduledStart ? new Date(dto.scheduledStart) : undefined;
        const endTime = dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined;
        if (startTime && endTime) {
            const hasConflict = await this.appointmentsRepo.hasConflict(existing.patientId, startTime, endTime, id);
            if (hasConflict) {
                throw new common_1.ConflictException('El paciente ya tiene una cita en ese horario');
            }
        }
        const updated = await this.appointmentsRepo.update(id, {
            scheduledStart: startTime,
            scheduledEnd: endTime,
            sessionType: dto.sessionType,
            adminNotes: dto.adminNotes,
            status: dto.status,
        });
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { updatedFields: Object.keys(dto) },
        });
        return updated;
    }
    async cancel(id, dto, actor) {
        const existing = await this.appointmentsRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Cita ${id} no encontrada`);
        }
        if (existing.status === client_1.AppointmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('La cita ya está cancelada');
        }
        const cancelled = await this.appointmentsRepo.cancel(id, dto.cancelReason);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { action: 'cancel', reason: dto.cancelReason },
        });
        return cancelled;
    }
    async confirm(id, actor) {
        const existing = await this.appointmentsRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Cita ${id} no encontrada`);
        }
        if (existing.status !== client_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Solo se pueden confirmar citas programadas');
        }
        const confirmed = await this.appointmentsRepo.confirm(id);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.UPDATE,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { action: 'confirm' },
        });
        return confirmed;
    }
    async softDelete(id, actor) {
        const existing = await this.appointmentsRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Cita ${id} no encontrada`);
        }
        await this.appointmentsRepo.softDelete(id);
        await this.auditService.log({
            actorId: actor.id,
            actorRole: actor.globalRole,
            actorIp: actor.ip,
            action: client_1.AuditAction.DELETE,
            resource: client_1.AuditResource.APPOINTMENT,
            resourceId: id,
            patientId: existing.patientId,
            success: true,
            details: { softDelete: true },
        });
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [appointments_repository_1.AppointmentsRepository,
        collaborations_repository_1.CollaborationsRepository,
        audit_service_1.AuditService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map