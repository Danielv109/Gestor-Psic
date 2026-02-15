// src/modules/clinical-history/clinical-history.module.ts
import { Module } from '@nestjs/common';
import { ClinicalHistoryController } from './clinical-history.controller';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistoryRepository } from './clinical-history.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [PrismaModule, AuditModule],
    controllers: [ClinicalHistoryController],
    providers: [ClinicalHistoryService, ClinicalHistoryRepository],
    exports: [ClinicalHistoryService],
})
export class ClinicalHistoryModule { }
