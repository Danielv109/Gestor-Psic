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
exports.AppointmentsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AppointmentsRepository = class AppointmentsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.appointment.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        externalId: true,
                    },
                },
            },
        });
    }
    async findByPatient(patientId) {
        return this.prisma.appointment.findMany({
            where: { patientId },
            orderBy: { scheduledStart: 'desc' },
        });
    }
    async findByDateRange(therapistId, startDate, endDate) {
        return this.prisma.appointment.findMany({
            where: {
                therapistId,
                deletedAt: null,
                scheduledStart: { gte: startDate },
                scheduledEnd: { lte: endDate },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        externalId: true,
                    },
                },
            },
            orderBy: { scheduledStart: 'asc' },
        });
    }
    async findUpcoming(therapistId, limit = 10) {
        return this.prisma.appointment.findMany({
            where: {
                therapistId,
                deletedAt: null,
                status: { notIn: [client_1.AppointmentStatus.CANCELLED, client_1.AppointmentStatus.COMPLETED] },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { scheduledStart: 'asc' },
            take: limit,
        });
    }
    async create(data) {
        return this.prisma.appointment.create({
            data,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async update(id, data) {
        return this.prisma.appointment.update({
            where: { id },
            data,
        });
    }
    async cancel(id, reason) {
        return this.prisma.appointment.update({
            where: { id },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });
    }
    async confirm(id) {
        return this.prisma.appointment.update({
            where: { id },
            data: {
                status: client_1.AppointmentStatus.CONFIRMED,
                confirmedAt: new Date(),
            },
        });
    }
    async softDelete(id) {
        return this.prisma.appointment.delete({
            where: { id },
        });
    }
    async hasConflict(patientId, startTime, endTime, excludeId) {
        const conflicts = await this.prisma.appointment.count({
            where: {
                patientId,
                id: excludeId ? { not: excludeId } : undefined,
                status: { notIn: [client_1.AppointmentStatus.CANCELLED] },
                OR: [
                    {
                        scheduledStart: { lte: startTime },
                        scheduledEnd: { gt: startTime },
                    },
                    {
                        scheduledStart: { lt: endTime },
                        scheduledEnd: { gte: endTime },
                    },
                    {
                        scheduledStart: { gte: startTime },
                        scheduledEnd: { lte: endTime },
                    },
                ],
            },
        });
        return conflicts > 0;
    }
};
exports.AppointmentsRepository = AppointmentsRepository;
exports.AppointmentsRepository = AppointmentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsRepository);
//# sourceMappingURL=appointments.repository.js.map