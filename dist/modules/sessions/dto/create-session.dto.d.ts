export declare class ClinicalNarrativeDto {
    subjectiveReport?: string;
    objectiveObservation?: string;
    assessment?: string;
    plan?: string;
    additionalNotes?: string;
}
export declare class CreateSessionDto {
    appointmentId: string;
    startedAt: string;
    clinicalNarrative?: ClinicalNarrativeDto;
}
