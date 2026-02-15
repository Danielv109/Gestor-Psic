import { Module } from '@nestjs/common';
import { PsychTestsController } from './psych-tests.controller';
import { PsychTestsService } from './psych-tests.service';
import { PsychTestsRepository } from './psych-tests.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuditModule],
    controllers: [PsychTestsController],
    providers: [PsychTestsService, PsychTestsRepository],
    exports: [PsychTestsService],
})
export class PsychTestsModule { }
