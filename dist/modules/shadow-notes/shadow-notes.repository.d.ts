import { PrismaService } from '../../prisma/prisma.service';
import { ShadowNote, Prisma } from '@prisma/client';
export declare class ShadowNotesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<ShadowNote | null>;
    findBySession(sessionId: string): Promise<ShadowNote | null>;
    findByTherapist(therapistId: string): Promise<ShadowNote[]>;
    create(data: Prisma.ShadowNoteCreateInput): Promise<ShadowNote>;
    update(id: string, data: Prisma.ShadowNoteUpdateInput): Promise<ShadowNote>;
    softDelete(id: string): Promise<ShadowNote>;
    existsForSession(sessionId: string): Promise<boolean>;
}
