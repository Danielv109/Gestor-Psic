// src/modules/clinical-history/dto/create-clinical-history.dto.ts
import { IsUUID, IsOptional, IsObject, IsDateString } from 'class-validator';

export class IdentificationDto {
    birthPlace?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    address?: string;
    phone?: string;
    emergencyContact?: string;
    referralSource?: string;
}

export class ConsultationDto {
    patientStatement?: string;
    onsetAndCourse?: string;
}

export class SubstanceDto {
    substance?: string;
    frequency?: string;
    amount?: string;
}

export class PersonalPathologicalDto {
    chronicDiseases?: string;
    currentMedications?: string;
    substances?: SubstanceDto[];
    previousTreatments?: boolean;
    previousTreatmentsDetails?: string;
}

export class AntecedentsDto {
    personalPathological?: PersonalPathologicalDto;
    hereditaryFamily?: string;
    familyDynamics?: string;
}

export class MentalExamDto {
    appearance?: string;
    consciousness?: string;
    orientation?: string[];
    language?: string;
    memory?: string;
    mood?: string;
    thinking?: string;
    judgmentOfReality?: string;
}

export class DiagnosticImpressionDto {
    hypothesis?: string;
    diagnosticCode?: string;
}

export class TreatmentPlanDto {
    objectives?: string[];
    modality?: string;
    frequency?: string;
    prognosis?: string;
}

export class CreateClinicalHistoryDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsDateString()
    openedAt?: string;

    @IsOptional()
    @IsObject()
    identification?: IdentificationDto;

    @IsOptional()
    @IsObject()
    consultation?: ConsultationDto;

    @IsOptional()
    @IsObject()
    antecedents?: AntecedentsDto;

    @IsOptional()
    @IsObject()
    mentalExam?: MentalExamDto;

    @IsOptional()
    @IsObject()
    diagnosticImpression?: DiagnosticImpressionDto;

    @IsOptional()
    @IsObject()
    treatmentPlan?: TreatmentPlanDto;
}

export class UpdateClinicalHistoryDto {
    @IsOptional()
    @IsObject()
    identification?: IdentificationDto;

    @IsOptional()
    @IsObject()
    consultation?: ConsultationDto;

    @IsOptional()
    @IsObject()
    antecedents?: AntecedentsDto;

    @IsOptional()
    @IsObject()
    mentalExam?: MentalExamDto;

    @IsOptional()
    @IsObject()
    diagnosticImpression?: DiagnosticImpressionDto;

    @IsOptional()
    @IsObject()
    treatmentPlan?: TreatmentPlanDto;
}
