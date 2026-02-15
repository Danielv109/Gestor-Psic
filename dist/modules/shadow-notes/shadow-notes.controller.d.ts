import { ShadowNotesService } from './shadow-notes.service';
import { CreateShadowNoteDto, UpdateShadowNoteDto } from './dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
export declare class ShadowNotesController {
    private readonly shadowNotesService;
    constructor(shadowNotesService: ShadowNotesService);
    create(dto: CreateShadowNoteDto, user: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        createdAt: Date;
    }>;
    findMyNotes(user: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findBySession(sessionId: string, user: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    findById(id: string, user: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateShadowNoteDto, user: AuthenticatedUser): Promise<{
        id: string;
        sessionId: string;
        updatedAt: Date;
    }>;
    remove(id: string, user: AuthenticatedUser): Promise<void>;
}
