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
exports.AppointmentAccessPolicy = void 0;
const common_1 = require("@nestjs/common");
const collaborations_repository_1 = require("../../collaborations/collaborations.repository");
const appointments_repository_1 = require("../appointments.repository");
const client_1 = require("@prisma/client");
let AppointmentAccessPolicy = class AppointmentAccessPolicy {
    constructor(collaborationsRepo, appointmentsRepo) {
        this.collaborationsRepo = collaborationsRepo;
        this.appointmentsRepo = appointmentsRepo;
    }
    async handle(user, request) {
        if (user.globalRole === client_1.GlobalRole.AUDITOR) {
            return false;
        }
        const appointmentId = request.params?.id;
        if (!appointmentId) {
            return true;
        }
        const appointment = await this.appointmentsRepo.findById(appointmentId);
        if (!appointment) {
            return false;
        }
        const collaboration = await this.collaborationsRepo.findActiveCollaboration(user.id, appointment.patientId);
        return collaboration !== null;
    }
};
exports.AppointmentAccessPolicy = AppointmentAccessPolicy;
exports.AppointmentAccessPolicy = AppointmentAccessPolicy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [collaborations_repository_1.CollaborationsRepository,
        appointments_repository_1.AppointmentsRepository])
], AppointmentAccessPolicy);
//# sourceMappingURL=appointment-access.policy.js.map