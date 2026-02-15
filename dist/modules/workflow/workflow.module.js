"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowModule = void 0;
const common_1 = require("@nestjs/common");
const workflow_controller_1 = require("./workflow.controller");
const clinical_workflow_service_1 = require("./clinical-workflow.service");
const amendment_service_1 = require("./amendment.service");
const appointment_state_machine_1 = require("./appointment-state-machine");
const appointments_module_1 = require("../appointments/appointments.module");
const sessions_module_1 = require("../sessions/sessions.module");
const crypto_module_1 = require("../../crypto/crypto.module");
const audit_module_1 = require("../audit/audit.module");
const prisma_module_1 = require("../../prisma/prisma.module");
let WorkflowModule = class WorkflowModule {
};
exports.WorkflowModule = WorkflowModule;
exports.WorkflowModule = WorkflowModule = __decorate([
    (0, common_1.Module)({
        imports: [
            appointments_module_1.AppointmentsModule,
            sessions_module_1.SessionsModule,
            crypto_module_1.CryptoModule,
            audit_module_1.AuditModule,
            prisma_module_1.PrismaModule,
        ],
        controllers: [workflow_controller_1.WorkflowController],
        providers: [
            clinical_workflow_service_1.ClinicalWorkflowService,
            amendment_service_1.AmendmentService,
            appointment_state_machine_1.AppointmentStateMachine,
        ],
        exports: [
            clinical_workflow_service_1.ClinicalWorkflowService,
            amendment_service_1.AmendmentService,
            appointment_state_machine_1.AppointmentStateMachine,
        ],
    })
], WorkflowModule);
//# sourceMappingURL=workflow.module.js.map