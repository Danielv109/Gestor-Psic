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
exports.PsychTestsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PsychTestsRepository = class PsychTestsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.psychTestResult.create({ data });
    }
    async findById(id) {
        return this.prisma.psychTestResult.findUnique({ where: { id } });
    }
    async findByPatient(patientId, testName) {
        const where = { patientId };
        if (testName)
            where.testName = testName;
        return this.prisma.psychTestResult.findMany({
            where,
            orderBy: { appliedAt: 'desc' },
        });
    }
    async getEvolution(patientId, testName) {
        return this.prisma.psychTestResult.findMany({
            where: { patientId, testName },
            select: {
                id: true,
                rawScore: true,
                maxScore: true,
                severity: true,
                appliedAt: true,
                notes: true,
            },
            orderBy: { appliedAt: 'asc' },
        });
    }
    async delete(id) {
        return this.prisma.psychTestResult.delete({ where: { id } });
    }
    async getDistinctTests(patientId) {
        const results = await this.prisma.psychTestResult.findMany({
            where: { patientId },
            select: { testName: true, testCode: true },
            distinct: ['testName'],
            orderBy: { testName: 'asc' },
        });
        return results;
    }
};
exports.PsychTestsRepository = PsychTestsRepository;
exports.PsychTestsRepository = PsychTestsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PsychTestsRepository);
//# sourceMappingURL=psych-tests.repository.js.map