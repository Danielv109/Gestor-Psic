// src/modules/shadow-notes/shadow-notes.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShadowNote, Prisma } from '@prisma/client';

@Injectable()
export class ShadowNotesRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<ShadowNote | null> {
        return this.prisma.shadowNote.findUnique({
            where: { id },
        });
    }

    async findBySession(sessionId: string): Promise<ShadowNote | null> {
        return this.prisma.shadowNote.findUnique({
            where: { sessionId },
        });
    }

    async findByTherapist(therapistId: string): Promise<ShadowNote[]> {
        return this.prisma.shadowNote.findMany({
            where: { therapistId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: Prisma.ShadowNoteCreateInput): Promise<ShadowNote> {
        return this.prisma.shadowNote.create({ data });
    }

    async update(id: string, data: Prisma.ShadowNoteUpdateInput): Promise<ShadowNote> {
        return this.prisma.shadowNote.update({
            where: { id },
            data,
        });
    }

    async softDelete(id: string): Promise<ShadowNote> {
        return this.prisma.shadowNote.delete({
            where: { id },
        });
    }

    async existsForSession(sessionId: string): Promise<boolean> {
        const count = await this.prisma.shadowNote.count({
            where: { sessionId },
        });
        return count > 0;
    }
}
