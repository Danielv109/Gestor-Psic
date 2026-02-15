// src/modules/patients/patients.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Patient, Prisma } from '@prisma/client';

@Injectable()
export class PatientsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Patient | null> {
        return this.prisma.patient.findUnique({
            where: { id },
        });
    }

    async findByExternalId(externalId: string): Promise<Patient | null> {
        return this.prisma.patient.findUnique({
            where: { externalId },
        });
    }

    async findByTherapist(therapistId: string): Promise<Patient[]> {
        // Retorna TODOS los pacientes activos (sin filtrar por colaboración)
        return this.prisma.patient.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: { lastName: 'asc' },
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.PatientWhereInput;
        orderBy?: Prisma.PatientOrderByWithRelationInput;
    }): Promise<Patient[]> {
        const { skip, take, where, orderBy } = params;
        return this.prisma.patient.findMany({
            skip,
            take,
            where,
            orderBy,
        });
    }

    async count(where?: Prisma.PatientWhereInput): Promise<number> {
        return this.prisma.patient.count({ where });
    }

    async create(data: Prisma.PatientCreateInput): Promise<Patient> {
        return this.prisma.patient.create({ data });
    }

    async update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
        return this.prisma.patient.update({
            where: { id },
            data,
        });
    }

    async softDelete(id: string): Promise<Patient> {
        // El middleware de Prisma convierte esto en soft delete
        return this.prisma.patient.delete({
            where: { id },
        });
    }

    async findWithCollaborations(id: string) {
        return this.prisma.patient.findUnique({
            where: { id },
            include: {
                clinicalTeam: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                globalRole: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async createCollaboration(data: {
        patientId: string;
        userId: string;
        contextualRole: string;
    }) {
        return this.prisma.clinicalCollaboration.create({
            data: {
                patientId: data.patientId,
                userId: data.userId,
                contextualRole: data.contextualRole as any,
                isActive: true,
            },
        });
    }
}
