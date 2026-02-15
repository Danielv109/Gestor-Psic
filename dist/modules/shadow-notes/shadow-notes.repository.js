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
exports.ShadowNotesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ShadowNotesRepository = class ShadowNotesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.shadowNote.findUnique({
            where: { id },
        });
    }
    async findBySession(sessionId) {
        return this.prisma.shadowNote.findUnique({
            where: { sessionId },
        });
    }
    async findByTherapist(therapistId) {
        return this.prisma.shadowNote.findMany({
            where: { therapistId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.shadowNote.create({ data });
    }
    async update(id, data) {
        return this.prisma.shadowNote.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        return this.prisma.shadowNote.delete({
            where: { id },
        });
    }
    async existsForSession(sessionId) {
        const count = await this.prisma.shadowNote.count({
            where: { sessionId },
        });
        return count > 0;
    }
};
exports.ShadowNotesRepository = ShadowNotesRepository;
exports.ShadowNotesRepository = ShadowNotesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShadowNotesRepository);
//# sourceMappingURL=shadow-notes.repository.js.map