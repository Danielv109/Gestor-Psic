// src/modules/workflow/workflow.module.ts
import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { ClinicalWorkflowService } from './clinical-workflow.service';
import { AmendmentService } from './amendment.service';
import { AppointmentStateMachine } from './appointment-state-machine';
import { AppointmentsModule } from '../appointments/appointments.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CryptoModule } from '../../crypto/crypto.module';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [
        AppointmentsModule,
        SessionsModule,
        CryptoModule,
        AuditModule,
        PrismaModule,
    ],
    controllers: [WorkflowController],
    providers: [
        ClinicalWorkflowService,
        AmendmentService,
        AppointmentStateMachine,
    ],
    exports: [
        ClinicalWorkflowService,
        AmendmentService,
        AppointmentStateMachine,
    ],
})
export class WorkflowModule { }
