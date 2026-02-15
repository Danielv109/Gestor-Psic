// src/modules/sessions/sessions.module.ts
import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { SessionAccessPolicy } from './policies/session-access.policy';
import { AppointmentsModule } from '../appointments/appointments.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { CryptoModule } from '../../crypto/crypto.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [AppointmentsModule, CollaborationsModule, CryptoModule, AuditModule],
    controllers: [SessionsController],
    providers: [SessionsService, SessionsRepository, SessionAccessPolicy],
    exports: [SessionsService, SessionsRepository],
})
export class SessionsModule { }
