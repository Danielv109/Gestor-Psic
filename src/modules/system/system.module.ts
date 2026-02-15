// src/modules/system/system.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { SystemBootstrapController } from './system-bootstrap.controller';
import { SystemBootstrapService } from './system-bootstrap.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ConfigService } from '@nestjs/config';

@Module({})
export class SystemModule {
    /**
     * Módulo condicional - solo se carga si SYSTEM_SETUP_TOKEN está configurado
     */
    static forRoot(): DynamicModule {
        return {
            module: SystemModule,
            imports: [PrismaModule, AuditModule],
            controllers: [SystemBootstrapController],
            providers: [SystemBootstrapService],
        };
    }
}
