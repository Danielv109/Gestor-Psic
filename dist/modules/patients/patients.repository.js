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
exports.PatientsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PatientsRepository = class PatientsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.patient.findUnique({
            where: { id },
        });
    }
    async findByExternalId(externalId) {
        return this.prisma.patient.findUnique({
            where: { externalId },
        });
    }
    async findByTherapist(therapistId) {
        return this.prisma.patient.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: { lastName: 'asc' },
        });
    }
    async findAll(params) {
        const { skip, take, where, orderBy } = params;
        return this.prisma.patient.findMany({
            skip,
            take,
            where,
            orderBy,
        });
    }
    async count(where) {
        return this.prisma.patient.count({ where });
    }
    async create(data) {
        return this.prisma.patient.create({ data });
    }
    async update(id, data) {
        return this.prisma.patient.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        return this.prisma.patient.delete({
            where: { id },
        });
    }
    async findWithCollaborations(id) {
        return this.prisma.patient.findUnique({
            where: { id },
            include: {
                clinicalTeam: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                globalRole: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async createCollaboration(data) {
        return this.prisma.clinicalCollaboration.create({
            data: {
                patientId: data.patientId,
                userId: data.userId,
                contextualRole: data.contextualRole,
                isActive: true,
            },
        });
    }
};
exports.PatientsRepository = PatientsRepository;
exports.PatientsRepository = PatientsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsRepository);
//# sourceMappingURL=patients.repository.js.map