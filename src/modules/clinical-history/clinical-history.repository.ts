// src/modules/clinical-history/clinical-history.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClinicalHistory, Prisma } from '@prisma/client';

@Injectable()
export class ClinicalHistoryRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.ClinicalHistoryCreateInput): Promise<ClinicalHistory> {
        return this.prisma.clinicalHistory.create({ data });
    }

    async findByPatientId(patientId: string): Promise<ClinicalHistory | null> {
        return this.prisma.clinicalHistory.findUnique({
            where: { patientId },
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        licenseNumber: true,
                        globalRole: true,
                    },
                },
            },
        });
    }

    async findById(id: string): Promise<ClinicalHistory | null> {
        return this.prisma.clinicalHistory.findUnique({
            where: { id },
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        licenseNumber: true,
                        globalRole: true,
                    },
                },
            },
        });
    }

    async update(id: string, data: Prisma.ClinicalHistoryUpdateInput): Promise<ClinicalHistory> {
        return this.prisma.clinicalHistory.update({
            where: { id },
            data,
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        licenseNumber: true,
                        globalRole: true,
                    },
                },
            },
        });
    }

    async existsForPatient(patientId: string): Promise<boolean> {
        const count = await this.prisma.clinicalHistory.count({
            where: { patientId },
        });
        return count > 0;
    }
}
