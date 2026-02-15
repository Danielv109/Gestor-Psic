// src/modules/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentAccessPolicy } from './policies/appointment-access.policy';
import { CollaborationsModule } from '../collaborations/collaborations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [CollaborationsModule, AuditModule],
    controllers: [AppointmentsController],
    providers: [AppointmentsService, AppointmentsRepository, AppointmentAccessPolicy],
    exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule { }
