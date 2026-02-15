export declare class IdentificationDto {
    birthPlace?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    address?: string;
    phone?: string;
    emergencyContact?: string;
    referralSource?: string;
}
export declare class ConsultationDto {
    patientStatement?: string;
    onsetAndCourse?: string;
}
export declare class SubstanceDto {
    substance?: string;
    frequency?: string;
    amount?: string;
}
export declare class PersonalPathologicalDto {
    chronicDiseases?: string;
    currentMedications?: string;
    substances?: SubstanceDto[];
    previousTreatments?: boolean;
    previousTreatmentsDetails?: string;
}
export declare class AntecedentsDto {
    personalPathological?: PersonalPathologicalDto;
    hereditaryFamily?: string;
    familyDynamics?: string;
}
export declare class MentalExamDto {
    appearance?: string;
    consciousness?: string;
    orientation?: string[];
    language?: string;
    memory?: string;
    mood?: string;
    thinking?: string;
    judgmentOfReality?: string;
}
export declare class DiagnosticImpressionDto {
    hypothesis?: string;
    diagnosticCode?: string;
}
export declare class TreatmentPlanDto {
    objectives?: string[];
    modality?: string;
    frequency?: string;
    prognosis?: string;
}
export declare class CreateClinicalHistoryDto {
    patientId: string;
    openedAt?: string;
    identification?: IdentificationDto;
    consultation?: ConsultationDto;
    antecedents?: AntecedentsDto;
    mentalExam?: MentalExamDto;
    diagnosticImpression?: DiagnosticImpressionDto;
    treatmentPlan?: TreatmentPlanDto;
}
export declare class UpdateClinicalHistoryDto {
    identification?: IdentificationDto;
    consultation?: ConsultationDto;
    antecedents?: AntecedentsDto;
    mentalExam?: MentalExamDto;
    diagnosticImpression?: DiagnosticImpressionDto;
    treatmentPlan?: TreatmentPlanDto;
}
