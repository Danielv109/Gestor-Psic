import { PolicyHandler } from '../../../common/interfaces/policy-handler.interface';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { ShadowNotesRepository } from '../shadow-notes.repository';
export declare class ShadowNoteOwnerPolicy implements PolicyHandler {
    private readonly shadowNotesRepo;
    constructor(shadowNotesRepo: ShadowNotesRepository);
    handle(user: AuthenticatedUser, request: any): Promise<boolean>;
}
