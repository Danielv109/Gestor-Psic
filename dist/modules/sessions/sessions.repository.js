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
exports.SessionsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SessionsRepository = class SessionsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.clinicalSession.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        externalId: true,
                    },
                },
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                appointment: {
                    select: {
                        id: true,
                        scheduledStart: true,
                        scheduledEnd: true,
                    },
                },
            },
        });
    }
    async findByAppointment(appointmentId) {
        return this.prisma.clinicalSession.findUnique({
            where: { appointmentId },
        });
    }
    async findByTherapist(therapistId, params) {
        return this.prisma.clinicalSession.findMany({
            where: {
                therapistId,
                isDraft: params?.isDraft,
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
            skip: params?.skip,
            take: params?.take,
        });
    }
    async findByPatient(patientId) {
        return this.prisma.clinicalSession.findMany({
            where: { patientId },
            include: {
                therapist: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { startedAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.clinicalSession.create({
            data,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }
    async update(id, data) {
        return this.prisma.clinicalSession.update({
            where: { id },
            data,
        });
    }
    async createVersion(data) {
        return this.prisma.clinicalSessionVersion.create({
            data,
        });
    }
    async getVersionCount(sessionId) {
        return this.prisma.clinicalSessionVersion.count({
            where: { sessionId },
        });
    }
    async getVersions(sessionId) {
        return this.prisma.clinicalSessionVersion.findMany({
            where: { sessionId },
            orderBy: { versionNumber: 'desc' },
        });
    }
    async sign(id, signatureHash) {
        return this.prisma.clinicalSession.update({
            where: { id },
            data: {
                signedAt: new Date(),
                signatureHash,
                isDraft: false,
                isLocked: true,
            },
        });
    }
    async softDelete(id) {
        return this.prisma.clinicalSession.delete({
            where: { id },
        });
    }
};
exports.SessionsRepository = SessionsRepository;
exports.SessionsRepository = SessionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsRepository);
//# sourceMappingURL=sessions.repository.js.map