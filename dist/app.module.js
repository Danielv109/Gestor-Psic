"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const crypto_module_1 = require("./crypto/crypto.module");
const audit_module_1 = require("./modules/audit/audit.module");
const patients_module_1 = require("./modules/patients/patients.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const appointments_module_1 = require("./modules/appointments/appointments.module");
const workflow_module_1 = require("./modules/workflow/workflow.module");
const export_module_1 = require("./modules/export/export.module");
const calendar_module_1 = require("./modules/calendar/calendar.module");
const collaborations_module_1 = require("./modules/collaborations/collaborations.module");
const shadow_notes_module_1 = require("./modules/shadow-notes/shadow-notes.module");
const clinical_history_module_1 = require("./modules/clinical-history/clinical-history.module");
const system_module_1 = require("./modules/system/system.module");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const throttler_module_1 = require("./common/throttling/throttler.module");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
let AppModule = class AppModule {
    configure(consumer) {
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            prisma_module_1.PrismaModule,
            crypto_module_1.CryptoModule,
            audit_module_1.AuditModule,
            throttler_module_1.AppThrottlerModule,
            auth_module_1.AuthModule,
            patients_module_1.PatientsModule,
            sessions_module_1.SessionsModule,
            appointments_module_1.AppointmentsModule,
            workflow_module_1.WorkflowModule,
            export_module_1.ExportModule,
            calendar_module_1.CalendarModule,
            collaborations_module_1.CollaborationsModule,
            shadow_notes_module_1.ShadowNotesModule,
            clinical_history_module_1.ClinicalHistoryModule,
            system_module_1.SystemModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: global_exception_filter_1.GlobalExceptionFilter,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map