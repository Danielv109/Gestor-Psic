// src/modules/collaborations/collaborations.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClinicalCollaboration, Prisma, ContextualRole } from '@prisma/client';

@Injectable()
export class CollaborationsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findActiveCollaboration(
        userId: string,
        patientId: string,
    ): Promise<ClinicalCollaboration | null> {
        return this.prisma.clinicalCollaboration.findFirst({
            where: {
                userId,
                patientId,
                isActive: true,
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } },
                ],
            },
        });
    }

    async findByPatient(patientId: string): Promise<ClinicalCollaboration[]> {
        return this.prisma.clinicalCollaboration.findMany({
            where: { patientId, isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        globalRole: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findByUser(userId: string): Promise<ClinicalCollaboration[]> {
        return this.prisma.clinicalCollaboration.findMany({
            where: { userId, isActive: true },
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

    async create(data: {
        userId: string;
        patientId: string;
        contextualRole: ContextualRole;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ClinicalCollaboration> {
        return this.prisma.clinicalCollaboration.create({
            data: {
                user: { connect: { id: data.userId } },
                patient: { connect: { id: data.patientId } },
                contextualRole: data.contextualRole,
                startDate: data.startDate || new Date(),
                endDate: data.endDate,
            },
        });
    }

    async deactivate(id: string): Promise<ClinicalCollaboration> {
        return this.prisma.clinicalCollaboration.update({
            where: { id },
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });
    }

    async hasRole(
        userId: string,
        patientId: string,
        roles: ContextualRole[],
    ): Promise<boolean> {
        const collaboration = await this.prisma.clinicalCollaboration.findFirst({
            where: {
                userId,
                patientId,
                isActive: true,
                contextualRole: { in: roles },
            },
        });
        return collaboration !== null;
    }
}
