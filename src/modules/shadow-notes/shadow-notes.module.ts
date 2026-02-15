// src/modules/shadow-notes/shadow-notes.module.ts
import { Module } from '@nestjs/common';
import { ShadowNotesController } from './shadow-notes.controller';
import { ShadowNotesService } from './shadow-notes.service';
import { ShadowNotesRepository } from './shadow-notes.repository';
import { ShadowNoteOwnerPolicy } from './policies/shadow-note-owner.policy';
import { SessionsModule } from '../sessions/sessions.module';
import { CryptoModule } from '../../crypto/crypto.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [SessionsModule, CryptoModule, AuditModule],
    controllers: [ShadowNotesController],
    providers: [ShadowNotesService, ShadowNotesRepository, ShadowNoteOwnerPolicy],
    exports: [ShadowNotesService, ShadowNotesRepository],
})
export class ShadowNotesModule { }
