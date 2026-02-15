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
var ExportSessionPolicy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportSessionPolicy = void 0;
const common_1 = require("@nestjs/common");
const collaborations_repository_1 = require("../../collaborations/collaborations.repository");
const sessions_repository_1 = require("../../sessions/sessions.repository");
const client_1 = require("@prisma/client");
let ExportSessionPolicy = ExportSessionPolicy_1 = class ExportSessionPolicy {
    constructor(collaborationsRepo, sessionsRepo) {
        this.collaborationsRepo = collaborationsRepo;
        this.sessionsRepo = sessionsRepo;
        this.logger = new common_1.Logger(ExportSessionPolicy_1.name);
    }
    async handle(user, request, context) {
        const sessionId = request.params?.id;
        if (!sessionId) {
            return false;
        }
        const session = await this.sessionsRepo.findById(sessionId);
        if (!session) {
            this.logger.warn(`Session ${sessionId} not found for export`);
            return false;
        }
        if (user.globalRole === client_1.GlobalRole.AUDITOR) {
            if (!session.signedAt) {
                this.logger.warn(`Auditor ${user.id} tried to export unsigned session`);
                return false;
            }
            return true;
        }
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(user.id, session.patientId);
        if (!collaboration) {
            this.logger.warn(`User ${user.id} has no collaboration for patient ${session.patientId}`);
            return false;
        }
        return true;
    }
};
exports.ExportSessionPolicy = ExportSessionPolicy;
exports.ExportSessionPolicy = ExportSessionPolicy = ExportSessionPolicy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [collaborations_repository_1.CollaborationsRepository,
        sessions_repository_1.SessionsRepository])
], ExportSessionPolicy);
//# sourceMappingURL=export-session.policy.js.map