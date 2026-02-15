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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PsychTestsService = exports.PSYCH_TEST_CATALOG = void 0;
const common_1 = require("@nestjs/common");
const psych_tests_repository_1 = require("./psych-tests.repository");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
exports.PSYCH_TEST_CATALOG = [
    {
        code: 'BDI-II', name: 'Inventario de Depresión de Beck', maxScore: 63,
        severities: [
            { min: 0, max: 13, label: 'Mínimo' },
            { min: 14, max: 19, label: 'Leve' },
            { min: 20, max: 28, label: 'Moderado' },
            { min: 29, max: 63, label: 'Severo' },
        ]
    },
    {
        code: 'BAI', name: 'Inventario de Ansiedad de Beck', maxScore: 63,
        severities: [
            { min: 0, max: 7, label: 'Mínimo' },
            { min: 8, max: 15, label: 'Leve' },
            { min: 16, max: 25, label: 'Moderado' },
            { min: 26, max: 63, label: 'Severo' },
        ]
    },
    {
        code: 'PHQ-9', name: 'Patient Health Questionnaire-9', maxScore: 27,
        severities: [
            { min: 0, max: 4, label: 'Mínimo' },
            { min: 5, max: 9, label: 'Leve' },
            { min: 10, max: 14, label: 'Moderado' },
            { min: 15, max: 19, label: 'Moderadamente severo' },
            { min: 20, max: 27, label: 'Severo' },
        ]
    },
    {
        code: 'GAD-7', name: 'Generalized Anxiety Disorder-7', maxScore: 21,
        severities: [
            { min: 0, max: 4, label: 'Mínimo' },
            { min: 5, max: 9, label: 'Leve' },
            { min: 10, max: 14, label: 'Moderado' },
            { min: 15, max: 21, label: 'Severo' },
        ]
    },
    {
        code: 'HAMILTON-D', name: 'Escala de Hamilton para Depresión', maxScore: 52,
        severities: [
            { min: 0, max: 7, label: 'Normal' },
            { min: 8, max: 13, label: 'Leve' },
            { min: 14, max: 18, label: 'Moderado' },
            { min: 19, max: 22, label: 'Severo' },
            { min: 23, max: 52, label: 'Muy severo' },
        ]
    },
    { code: 'MMPI-2', name: 'Inventario Multifásico de Personalidad de Minnesota', maxScore: null, severities: [] },
    { code: 'STAI', name: 'Inventario de Ansiedad Estado-Rasgo', maxScore: 80, severities: [] },
    { code: 'SCL-90', name: 'Symptom Checklist-90', maxScore: null, severities: [] },
];
let PsychTestsService = class PsychTestsService {
    constructor(repo, audit) {
        this.repo = repo;
        this.audit = audit;
    }
    getCatalog() {
        return exports.PSYCH_TEST_CATALOG;
    }
    async create(patientId, dto, user) {
        let severity = dto.severity;
        if (!severity && dto.testCode) {
            const catalogEntry = exports.PSYCH_TEST_CATALOG.find(t => t.code === dto.testCode);
            if (catalogEntry) {
                const match = catalogEntry.severities.find(s => dto.rawScore >= s.min && dto.rawScore <= s.max);
                if (match)
                    severity = match.label;
            }
        }
        const result = await this.repo.create({
            patientId,
            therapistId: user.id,
            sessionId: dto.sessionId,
            testName: dto.testName,
            testCode: dto.testCode,
            rawScore: dto.rawScore,
            maxScore: dto.maxScore,
            severity,
            percentile: dto.percentile,
            notes: dto.notes,
            appliedAt: new Date(dto.appliedAt),
        });
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.CREATE,
            resource: client_1.AuditResource.PSYCH_TEST,
            resourceId: result.id,
            patientId,
            details: { testName: dto.testName, rawScore: dto.rawScore },
        });
        return result;
    }
    async findByPatient(patientId, testName) {
        return this.repo.findByPatient(patientId, testName);
    }
    async getEvolution(patientId, testName) {
        return this.repo.getEvolution(patientId, testName);
    }
    async getDistinctTests(patientId) {
        return this.repo.getDistinctTests(patientId);
    }
    async delete(id, user) {
        const result = await this.repo.findById(id);
        if (!result)
            throw new common_1.NotFoundException('Resultado no encontrado');
        await this.repo.delete(id);
        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: client_1.AuditAction.DELETE,
            resource: client_1.AuditResource.PSYCH_TEST,
            resourceId: id,
            patientId: result.patientId,
        });
    }
};
exports.PsychTestsService = PsychTestsService;
exports.PsychTestsService = PsychTestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [psych_tests_repository_1.PsychTestsRepository,
        audit_service_1.AuditService])
], PsychTestsService);
//# sourceMappingURL=psych-tests.service.js.map