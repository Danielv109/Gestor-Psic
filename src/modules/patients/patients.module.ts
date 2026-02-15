// src/modules/patients/patients.module.ts
import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { PatientAccessPolicy } from './policies/patient-access.policy';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [CollaborationsModule, AuditModule],
    controllers: [PatientsController],
    providers: [PatientsService, PatientsRepository, PatientAccessPolicy],
    exports: [PatientsService, PatientsRepository],
})
export class PatientsModule { }
