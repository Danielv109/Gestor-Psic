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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const softDeleteContext = new Map();
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to database');
        this.applySoftDeleteMiddleware();
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Disconnected from database');
    }
    setIncludeDeleted(requestId, context) {
        softDeleteContext.set(requestId, context);
    }
    clearIncludeDeleted(requestId) {
        softDeleteContext.delete(requestId);
    }
    shouldIncludeDeleted(requestId) {
        if (!requestId)
            return false;
        const context = softDeleteContext.get(requestId);
        return context?.includeDeleted === true;
    }
    async withDeletedRecords(requestId, operation) {
        this.setIncludeDeleted(requestId, { includeDeleted: true });
        try {
            return await operation();
        }
        finally {
            this.clearIncludeDeleted(requestId);
        }
    }
    applySoftDeleteMiddleware() {
        const softDeleteModels = [
            'User',
            'Patient',
            'ClinicalCollaboration',
            'Appointment',
            'ClinicalSession',
            'ShadowNote',
        ];
        const excludedModels = [
            'AuditLog',
            'SystemConfig',
        ];
        this.$use(async (params, next) => {
            if (!params.model || !softDeleteModels.includes(params.model)) {
                return next(params);
            }
            if (params.model && excludedModels.includes(params.model)) {
                return next(params);
            }
            const includeDeleted = params.args?.includeDeleted === true;
            if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
                params.args = params.args || {};
                params.args.where = params.args.where || {};
                if (params.args.includeDeleted !== undefined) {
                    delete params.args.includeDeleted;
                }
                if (!includeDeleted && params.args.where.deletedAt === undefined) {
                    params.args.where.deletedAt = null;
                }
            }
            if (params.action === 'delete') {
                params.action = 'update';
                params.args.data = { deletedAt: new Date() };
            }
            if (params.action === 'deleteMany') {
                params.action = 'updateMany';
                if (params.args.data) {
                    params.args.data.deletedAt = new Date();
                }
                else {
                    params.args.data = { deletedAt: new Date() };
                }
            }
            return next(params);
        });
        this.logger.log('Soft delete middleware applied (excludes: AuditLog)');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map