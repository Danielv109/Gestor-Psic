// src/modules/sessions/sessions.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClinicalSession, Prisma } from '@prisma/client';

@Injectable()
export class SessionsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<ClinicalSession | null> {
        return this.prisma.clinicalSession.findUnique({
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
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                appointment: {
                    select: {
                        id: true,
                        scheduledStart: true,
                        scheduledEnd: true,
                    },
                },
            },
        });
    }

    async findByAppointment(appointmentId: string): Promise<ClinicalSession | null> {
        return this.prisma.clinicalSession.findUnique({
            where: { appointmentId },
        });
    }

    async findByTherapist(therapistId: string, params?: {
        skip?: number;
        take?: number;
        isDraft?: boolean;
    }): Promise<ClinicalSession[]> {
        return this.prisma.clinicalSession.findMany({
            where: {
                therapistId,
                isDraft: params?.isDraft,
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
            orderBy: { startedAt: 'desc' },
            skip: params?.skip,
            take: params?.take,
        });
    }

    async findByPatient(patientId: string): Promise<ClinicalSession[]> {
        return this.prisma.clinicalSession.findMany({
            where: { patientId },
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    async create(data: Prisma.ClinicalSessionCreateInput): Promise<ClinicalSession> {
        return this.prisma.clinicalSession.create({
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
        data: Prisma.ClinicalSessionUpdateInput,
    ): Promise<ClinicalSession> {
        return this.prisma.clinicalSession.update({
            where: { id },
            data,
        });
    }

    async createVersion(data: {
        sessionId: string;
        versionNumber: number;
        narrativeSnapshotEncrypted: Buffer;
        narrativeIV: Buffer;
        narrativeKeyId: string;
        changedBy: string;
        changeReason?: string;
    }) {
        return this.prisma.clinicalSessionVersion.create({
            data,
        });
    }

    async getVersionCount(sessionId: string): Promise<number> {
        return this.prisma.clinicalSessionVersion.count({
            where: { sessionId },
        });
    }

    async getVersions(sessionId: string) {
        return this.prisma.clinicalSessionVersion.findMany({
            where: { sessionId },
            orderBy: { versionNumber: 'desc' },
        });
    }

    async sign(id: string, signatureHash: string): Promise<ClinicalSession> {
        return this.prisma.clinicalSession.update({
            where: { id },
            data: {
                signedAt: new Date(),
                signatureHash,
                isDraft: false,
                isLocked: true,
            },
        });
    }

    async softDelete(id: string): Promise<ClinicalSession> {
        return this.prisma.clinicalSession.delete({
            where: { id },
        });
    }
}
