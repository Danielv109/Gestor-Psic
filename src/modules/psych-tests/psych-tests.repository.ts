import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PsychTestsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.PsychTestResultUncheckedCreateInput) {
        return this.prisma.psychTestResult.create({ data });
    }

    async findById(id: string) {
        return this.prisma.psychTestResult.findUnique({ where: { id } });
    }

    async findByPatient(patientId: string, testName?: string) {
        const where: Prisma.PsychTestResultWhereInput = { patientId };
        if (testName) where.testName = testName;

        return this.prisma.psychTestResult.findMany({
            where,
            orderBy: { appliedAt: 'desc' },
        });
    }

    async getEvolution(patientId: string, testName: string) {
        return this.prisma.psychTestResult.findMany({
            where: { patientId, testName },
            select: {
                id: true,
                rawScore: true,
                maxScore: true,
                severity: true,
                appliedAt: true,
                notes: true,
            },
            orderBy: { appliedAt: 'asc' },
        });
    }

    async delete(id: string) {
        return this.prisma.psychTestResult.delete({ where: { id } });
    }

    async getDistinctTests(patientId: string) {
        const results = await this.prisma.psychTestResult.findMany({
            where: { patientId },
            select: { testName: true, testCode: true },
            distinct: ['testName'],
            orderBy: { testName: 'asc' },
        });
        return results;
    }
}
