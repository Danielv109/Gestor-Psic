// src/modules/export/export.module.ts
import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { CryptoModule } from '../../crypto/crypto.module';
import { AuditModule } from '../audit/audit.module';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { SessionsModule } from '../sessions/sessions.module';
import { PatientsModule } from '../patients/patients.module';
import { ExportSessionPolicy } from './policies/export-session.policy';
import { ExportPatientPolicy } from './policies/export-patient.policy';
import { PoliciesGuard } from '../../common/guards/policies.guard';

@Module({
    imports: [
        CryptoModule,
        AuditModule,
        CollaborationsModule,
        SessionsModule,
        PatientsModule,
    ],
    controllers: [ExportController],
    providers: [
        ExportService,
        ExportSessionPolicy,
        ExportPatientPolicy,
        PoliciesGuard,
    ],
    exports: [ExportService],
})
export class ExportModule { }
