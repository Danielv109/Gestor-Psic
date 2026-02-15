"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalHistoryModule = void 0;
const common_1 = require("@nestjs/common");
const clinical_history_controller_1 = require("./clinical-history.controller");
const clinical_history_service_1 = require("./clinical-history.service");
const clinical_history_repository_1 = require("./clinical-history.repository");
const prisma_module_1 = require("../../prisma/prisma.module");
const audit_module_1 = require("../audit/audit.module");
let ClinicalHistoryModule = class ClinicalHistoryModule {
};
exports.ClinicalHistoryModule = ClinicalHistoryModule;
exports.ClinicalHistoryModule = ClinicalHistoryModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_module_1.AuditModule],
        controllers: [clinical_history_controller_1.ClinicalHistoryController],
        providers: [clinical_history_service_1.ClinicalHistoryService, clinical_history_repository_1.ClinicalHistoryRepository],
        exports: [clinical_history_service_1.ClinicalHistoryService],
    })
], ClinicalHistoryModule);
//# sourceMappingURL=clinical-history.module.js.map