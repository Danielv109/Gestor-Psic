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
exports.CreateAppointmentDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateAppointmentDto {
}
exports.CreateAppointmentDto = CreateAppointmentDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'patientId debe ser un UUID válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'patientId es requerido' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'scheduledStart debe ser una fecha ISO 8601 válida' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'scheduledStart es requerido' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "scheduledStart", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'scheduledEnd debe ser una fecha ISO 8601 válida' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'scheduledEnd es requerido' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "scheduledEnd", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SessionType, { message: 'sessionType debe ser un tipo de sesión válido' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "sessionType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "adminNotes", void 0);
//# sourceMappingURL=create-appointment.dto.js.map