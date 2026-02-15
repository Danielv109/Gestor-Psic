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
exports.CreateSessionDto = exports.ClinicalNarrativeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ClinicalNarrativeDto {
}
exports.ClinicalNarrativeDto = ClinicalNarrativeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], ClinicalNarrativeDto.prototype, "subjectiveReport", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], ClinicalNarrativeDto.prototype, "objectiveObservation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], ClinicalNarrativeDto.prototype, "assessment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], ClinicalNarrativeDto.prototype, "plan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], ClinicalNarrativeDto.prototype, "additionalNotes", void 0);
class CreateSessionDto {
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)('4', { message: 'appointmentId debe ser un UUID válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'appointmentId es requerido' }),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "appointmentId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'startedAt debe ser una fecha ISO 8601 válida' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'startedAt es requerido' }),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "startedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ClinicalNarrativeDto),
    __metadata("design:type", ClinicalNarrativeDto)
], CreateSessionDto.prototype, "clinicalNarrative", void 0);
//# sourceMappingURL=create-session.dto.js.map