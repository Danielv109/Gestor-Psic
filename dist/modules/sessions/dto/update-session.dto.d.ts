import { ClinicalNarrativeDto } from './create-session.dto';
export declare class UpdateSessionDto {
    endedAt?: string;
    clinicalNarrative?: ClinicalNarrativeDto;
    changeReason?: string;
}
export declare class SignSessionDto {
    signatureConfirmation: string;
}
