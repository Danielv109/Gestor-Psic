"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const sessions_controller_1 = require("./sessions.controller");
const sessions_service_1 = require("./sessions.service");
const sessions_repository_1 = require("./sessions.repository");
const session_access_policy_1 = require("./policies/session-access.policy");
const appointments_module_1 = require("../appointments/appointments.module");
const collaborations_module_1 = require("../collaborations/collaborations.module");
const crypto_module_1 = require("../../crypto/crypto.module");
const audit_module_1 = require("../audit/audit.module");
let SessionsModule = class SessionsModule {
};
exports.SessionsModule = SessionsModule;
exports.SessionsModule = SessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [appointments_module_1.AppointmentsModule, collaborations_module_1.CollaborationsModule, crypto_module_1.CryptoModule, audit_module_1.AuditModule],
        controllers: [sessions_controller_1.SessionsController],
        providers: [sessions_service_1.SessionsService, sessions_repository_1.SessionsRepository, session_access_policy_1.SessionAccessPolicy],
        exports: [sessions_service_1.SessionsService, sessions_repository_1.SessionsRepository],
    })
], SessionsModule);
//# sourceMappingURL=sessions.module.js.map