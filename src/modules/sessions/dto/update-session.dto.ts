// src/modules/sessions/dto/update-session.dto.ts
import { IsOptional, IsDateString, ValidateNested, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ClinicalNarrativeDto } from './create-session.dto';

export class UpdateSessionDto {
    @IsOptional()
    @IsDateString({}, { message: 'endedAt debe ser una fecha ISO 8601 válida' })
    endedAt?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ClinicalNarrativeDto)
    clinicalNarrative?: ClinicalNarrativeDto;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    changeReason?: string; // Razón del cambio para versionado
}

export class SignSessionDto {
    @IsString()
    @IsNotEmpty({ message: 'signatureConfirmation es requerido' })
    @MaxLength(255)
    signatureConfirmation: string; // Confirmación explícita de firma
}
