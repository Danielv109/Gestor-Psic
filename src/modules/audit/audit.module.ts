// src/modules/audit/audit.module.ts
import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { LegalHoldService } from './legal-hold.service';
import { ExportRecordService } from './export-record.service';
import { SensitiveAccessInterceptor } from './sensitive-access.interceptor';
import { PrismaModule } from '../../prisma/prisma.module';

@Global() // Disponible globalmente
@Module({
    imports: [PrismaModule],
    providers: [
        AuditService,
        LegalHoldService,
        ExportRecordService,
        SensitiveAccessInterceptor,
    ],
    exports: [
        AuditService,
        LegalHoldService,
        ExportRecordService,
        SensitiveAccessInterceptor,
    ],
})
export class AuditModule { }
