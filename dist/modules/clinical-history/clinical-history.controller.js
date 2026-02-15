"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalHistoryController = void 0;
const common_1 = require("@nestjs/common");
const clinical_history_service_1 = require("./clinical-history.service");
const dto_1 = require("./dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ClinicalHistoryController = class ClinicalHistoryController {
    constructor(service) {
        this.service = service;
    }
    async create(dto, user) {
        return this.service.create(dto, user);
    }
    async findByPatient(patientId, user) {
        return this.service.findByPatientId(patientId, user);
    }
    async update(id, dto, user) {
        return this.service.update(id, dto, user);
    }
};
exports.ClinicalHistoryController = ClinicalHistoryController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateClinicalHistoryDto, Object]),
    __metadata("design:returntype", Promise)
], ClinicalHistoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ClinicalHistoryController.prototype, "findByPatient", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateClinicalHistoryDto, Object]),
    __metadata("design:returntype", Promise)
], ClinicalHistoryController.prototype, "update", null);
exports.ClinicalHistoryController = ClinicalHistoryController = __decorate([
    (0, common_1.Controller)('clinical-history'),
    __metadata("design:paramtypes", [clinical_history_service_1.ClinicalHistoryService])
], ClinicalHistoryController);
//# sourceMappingURL=clinical-history.controller.js.map