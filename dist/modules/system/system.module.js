"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SystemModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemModule = void 0;
const common_1 = require("@nestjs/common");
const system_bootstrap_controller_1 = require("./system-bootstrap.controller");
const system_bootstrap_service_1 = require("./system-bootstrap.service");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let SystemModule = SystemModule_1 = class SystemModule {
    static forRoot() {
        return {
            module: SystemModule_1,
            imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
            controllers: [system_bootstrap_controller_1.SystemBootstrapController],
            providers: [system_bootstrap_service_1.SystemBootstrapService],
        };
    }
};
exports.SystemModule = SystemModule;
exports.SystemModule = SystemModule = SystemModule_1 = __decorate([
    (0, common_1.Module)({})
], SystemModule);
//# sourceMappingURL=system.module.js.map