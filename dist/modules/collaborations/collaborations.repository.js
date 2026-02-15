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
exports.CollaborationsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CollaborationsRepository = class CollaborationsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findActiveCollaboration(userId, patientId) {
        return this.prisma.clinicalCollaboration.findFirst({
            where: {
                userId,
                patientId,
                isActive: true,
                OR: [
                    { endDate: null },
                    { endDate: { gte: new Date() } },
                ],
            },
        });
    }
    async findByPatient(patientId) {
        return this.prisma.clinicalCollaboration.findMany({
            where: { patientId, isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        globalRole: true,
                        email: true,
                    },
                },
            },
        });
    }
    async findByUser(userId) {
        return this.prisma.clinicalCollaboration.findMany({
            where: { userId, isActive: true },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        externalId: true,
                    },
                },
            },
        });
    }
    async create(data) {
        return this.prisma.clinicalCollaboration.create({
            data: {
                user: { connect: { id: data.userId } },
                patient: { connect: { id: data.patientId } },
                contextualRole: data.contextualRole,
                startDate: data.startDate || new Date(),
                endDate: data.endDate,
            },
        });
    }
    async deactivate(id) {
        return this.prisma.clinicalCollaboration.update({
            where: { id },
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });
    }
    async hasRole(userId, patientId, roles) {
        const collaboration = await this.prisma.clinicalCollaboration.findFirst({
            where: {
                userId,
                patientId,
                isActive: true,
                contextualRole: { in: roles },
            },
        });
        return collaboration !== null;
    }
};
exports.CollaborationsRepository = CollaborationsRepository;
exports.CollaborationsRepository = CollaborationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CollaborationsRepository);
//# sourceMappingURL=collaborations.repository.js.map