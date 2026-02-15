import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttachmentsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: Prisma.PatientAttachmentUncheckedCreateInput) {
        return this.prisma.patientAttachment.create({ data });
    }

    async findById(id: string) {
        return this.prisma.patientAttachment.findFirst({
            where: { id, deletedAt: null },
        });
    }

    async findByPatient(patientId: string) {
        return this.prisma.patientAttachment.findMany({
            where: { patientId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }

    async softDelete(id: string) {
        return this.prisma.patientAttachment.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
