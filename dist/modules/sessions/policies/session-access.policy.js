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
exports.SessionAccessPolicy = void 0;
const common_1 = require("@nestjs/common");
const collaborations_repository_1 = require("../../collaborations/collaborations.repository");
const sessions_repository_1 = require("../sessions.repository");
const client_1 = require("@prisma/client");
let SessionAccessPolicy = class SessionAccessPolicy {
    constructor(collaborationsRepo, sessionsRepo) {
        this.collaborationsRepo = collaborationsRepo;
        this.sessionsRepo = sessionsRepo;
    }
    async handle(user, request) {
        if (user.globalRole === client_1.GlobalRole.AUDITOR) {
            return false;
        }
        const sessionId = request.params?.id;
        if (!sessionId) {
            return true;
        }
        const session = await this.sessionsRepo.findById(sessionId);
        if (!session) {
            return false;
        }
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(user.id, session.patientId);
        if (!collaboration) {
            return false;
        }
        if (request.method === 'PUT' || request.method === 'DELETE') {
            if (session.therapistId === user.id) {
                return true;
            }
            if (collaboration.contextualRole === client_1.ContextualRole.SUPERVISOR_CASO) {
                return request.method === 'GET';
            }
            return false;
        }
        return true;
    }
};
exports.SessionAccessPolicy = SessionAccessPolicy;
exports.SessionAccessPolicy = SessionAccessPolicy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [collaborations_repository_1.CollaborationsRepository,
        sessions_repository_1.SessionsRepository])
], SessionAccessPolicy);
//# sourceMappingURL=session-access.policy.js.map