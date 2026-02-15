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
exports.UpdateClinicalHistoryDto = exports.CreateClinicalHistoryDto = exports.TreatmentPlanDto = exports.DiagnosticImpressionDto = exports.MentalExamDto = exports.AntecedentsDto = exports.PersonalPathologicalDto = exports.SubstanceDto = exports.ConsultationDto = exports.IdentificationDto = void 0;
const class_validator_1 = require("class-validator");
class IdentificationDto {
}
exports.IdentificationDto = IdentificationDto;
class ConsultationDto {
}
exports.ConsultationDto = ConsultationDto;
class SubstanceDto {
}
exports.SubstanceDto = SubstanceDto;
class PersonalPathologicalDto {
}
exports.PersonalPathologicalDto = PersonalPathologicalDto;
class AntecedentsDto {
}
exports.AntecedentsDto = AntecedentsDto;
class MentalExamDto {
}
exports.MentalExamDto = MentalExamDto;
class DiagnosticImpressionDto {
}
exports.DiagnosticImpressionDto = DiagnosticImpressionDto;
class TreatmentPlanDto {
}
exports.TreatmentPlanDto = TreatmentPlanDto;
class CreateClinicalHistoryDto {
}
exports.CreateClinicalHistoryDto = CreateClinicalHistoryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateClinicalHistoryDto.prototype, "patientId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateClinicalHistoryDto.prototype, "openedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", IdentificationDto)
], CreateClinicalHistoryDto.prototype, "identification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", ConsultationDto)
], CreateClinicalHistoryDto.prototype, "consultation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", AntecedentsDto)
], CreateClinicalHistoryDto.prototype, "antecedents", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", MentalExamDto)
], CreateClinicalHistoryDto.prototype, "mentalExam", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", DiagnosticImpressionDto)
], CreateClinicalHistoryDto.prototype, "diagnosticImpression", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", TreatmentPlanDto)
], CreateClinicalHistoryDto.prototype, "treatmentPlan", void 0);
class UpdateClinicalHistoryDto {
}
exports.UpdateClinicalHistoryDto = UpdateClinicalHistoryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", IdentificationDto)
], UpdateClinicalHistoryDto.prototype, "identification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", ConsultationDto)
], UpdateClinicalHistoryDto.prototype, "consultation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", AntecedentsDto)
], UpdateClinicalHistoryDto.prototype, "antecedents", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", MentalExamDto)
], UpdateClinicalHistoryDto.prototype, "mentalExam", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", DiagnosticImpressionDto)
], UpdateClinicalHistoryDto.prototype, "diagnosticImpression", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", TreatmentPlanDto)
], UpdateClinicalHistoryDto.prototype, "treatmentPlan", void 0);
//# sourceMappingURL=create-clinical-history.dto.js.map