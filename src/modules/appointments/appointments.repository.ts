// src/modules/appointments/appointments.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Appointment, Prisma, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Appointment | null> {
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

    async findByPatient(patientId: string): Promise<Appointment[]> {
        return this.prisma.appointment.findMany({
            where: { patientId },
            orderBy: { scheduledStart: 'desc' },
        });
    }

    async findByDateRange(
        therapistId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<Appointment[]> {
        return this.prisma.appointment.findMany({
            where: {
                scheduledStart: { gte: startDate },
                scheduledEnd: { lte: endDate },
                patient: {
                    clinicalTeam: {
                        some: {
                            userId: therapistId,
                            isActive: true,
                        },
                    },
                },
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

    async findUpcoming(therapistId: string, limit = 10): Promise<Appointment[]> {
        return this.prisma.appointment.findMany({
            where: {
                scheduledStart: { gte: new Date() },
                status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
                patient: {
                    clinicalTeam: {
                        some: {
                            userId: therapistId,
                            isActive: true,
                        },
                    },
                },
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

    async create(data: Prisma.AppointmentCreateInput): Promise<Appointment> {
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

    async update(
        id: string,
        data: Prisma.AppointmentUpdateInput,
    ): Promise<Appointment> {
        return this.prisma.appointment.update({
            where: { id },
            data,
        });
    }

    async cancel(id: string, reason: string): Promise<Appointment> {
        return this.prisma.appointment.update({
            where: { id },
            data: {
                status: AppointmentStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelReason: reason,
            },
        });
    }

    async confirm(id: string): Promise<Appointment> {
        return this.prisma.appointment.update({
            where: { id },
            data: {
                status: AppointmentStatus.CONFIRMED,
                confirmedAt: new Date(),
            },
        });
    }

    async softDelete(id: string): Promise<Appointment> {
        return this.prisma.appointment.delete({
            where: { id },
        });
    }

    async hasConflict(
        patientId: string,
        startTime: Date,
        endTime: Date,
        excludeId?: string,
    ): Promise<boolean> {
        const conflicts = await this.prisma.appointment.count({
            where: {
                patientId,
                id: excludeId ? { not: excludeId } : undefined,
                status: { notIn: [AppointmentStatus.CANCELLED] },
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
}
