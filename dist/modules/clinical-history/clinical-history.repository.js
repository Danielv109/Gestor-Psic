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
exports.ClinicalHistoryRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ClinicalHistoryRepository = class ClinicalHistoryRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.clinicalHistory.create({ data });
    }
    async findByPatientId(patientId) {
        return this.prisma.clinicalHistory.findUnique({
            where: { patientId },
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        licenseNumber: true,
                        globalRole: true,
                    },
                },
            },
        });
    }
    async findById(id) {
        return this.prisma.clinicalHistory.findUnique({
            where: { id },
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        licenseNumber: true,
                        globalRole: true,
                    },
                },
            },
        });
    }
    async update(id, data) {
        return this.prisma.clinicalHistory.update({
            where: { id },
            data,
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        licenseNumber: true,
                        globalRole: true,
                    },
                },
            },
        });
    }
    async existsForPatient(patientId) {
        const count = await this.prisma.clinicalHistory.count({
            where: { patientId },
        });
        return count > 0;
    }
};
exports.ClinicalHistoryRepository = ClinicalHistoryRepository;
exports.ClinicalHistoryRepository = ClinicalHistoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClinicalHistoryRepository);
//# sourceMappingURL=clinical-history.repository.js.map