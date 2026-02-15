// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CryptoModule } from './crypto/crypto.module';
import { AuditModule } from './modules/audit/audit.module';

// Feature modules
import { PatientsModule } from './modules/patients/patients.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { ExportModule } from './modules/export/export.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CollaborationsModule } from './modules/collaborations/collaborations.module';
import { ShadowNotesModule } from './modules/shadow-notes/shadow-notes.module';
import { ClinicalHistoryModule } from './modules/clinical-history/clinical-history.module';
import { SystemModule } from './modules/system/system.module';

// Common
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppThrottlerModule } from './common/throttling/throttler.module';

// Guards
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Core
        PrismaModule,
        CryptoModule,
        AuditModule,
        AppThrottlerModule,
        AuthModule,

        // Features
        PatientsModule,
        SessionsModule,
        AppointmentsModule,
        WorkflowModule,
        ExportModule,
        CalendarModule,
        CollaborationsModule,
        ShadowNotesModule,
        ClinicalHistoryModule,
        SystemModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
        // Global authentication guard - checks JWT on all routes
        // Routes marked with @Public() bypass authentication
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        // RolesGuard DESACTIVADO - todos los roles tienen todos los permisos
        // {
        //     provide: APP_GUARD,
        //     useClass: RolesGuard,
        // },
        // NOTE: ThrottlerGuard is NOT registered globally.
        // Controllers apply @UseGuards(ThrottlerGuard) + @Throttle()
        // per-route to select specific limits.
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Add any middleware if needed
    }
}
