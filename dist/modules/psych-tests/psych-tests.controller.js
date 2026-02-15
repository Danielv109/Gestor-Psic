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
exports.PsychTestsController = void 0;
const common_1 = require("@nestjs/common");
const psych_tests_service_1 = require("./psych-tests.service");
const create_test_result_dto_1 = require("./dto/create-test-result.dto");
let PsychTestsController = class PsychTestsController {
    constructor(psychTests) {
        this.psychTests = psychTests;
    }
    getCatalog() {
        return this.psychTests.getCatalog();
    }
    async createResult(patientId, dto, req) {
        return this.psychTests.create(patientId, dto, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }
    async getResults(patientId, testName) {
        return this.psychTests.findByPatient(patientId, testName);
    }
    async getEvolution(patientId, testName) {
        return this.psychTests.getEvolution(patientId, testName);
    }
    async getDistinctTests(patientId) {
        return this.psychTests.getDistinctTests(patientId);
    }
    async deleteResult(id, req) {
        return this.psychTests.delete(id, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }
};
exports.PsychTestsController = PsychTestsController;
__decorate([
    (0, common_1.Get)('psych-tests/catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PsychTestsController.prototype, "getCatalog", null);
__decorate([
    (0, common_1.Post)('patients/:patientId/test-results'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_test_result_dto_1.CreateTestResultDto, Object]),
    __metadata("design:returntype", Promise)
], PsychTestsController.prototype, "createResult", null);
__decorate([
    (0, common_1.Get)('patients/:patientId/test-results'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Query)('testName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PsychTestsController.prototype, "getResults", null);
__decorate([
    (0, common_1.Get)('patients/:patientId/test-results/evolution'),
    __param(0, (0, common_1.Param)('patientId')),
    __param(1, (0, common_1.Query)('testName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PsychTestsController.prototype, "getEvolution", null);
__decorate([
    (0, common_1.Get)('patients/:patientId/test-results/tests'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PsychTestsController.prototype, "getDistinctTests", null);
__decorate([
    (0, common_1.Delete)('test-results/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PsychTestsController.prototype, "deleteResult", null);
exports.PsychTestsController = PsychTestsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [psych_tests_service_1.PsychTestsService])
], PsychTestsController);
//# sourceMappingURL=psych-tests.controller.js.map