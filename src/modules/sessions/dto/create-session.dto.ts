// src/modules/sessions/dto/create-session.dto.ts
import {
    IsUUID,
    IsDateString,
    IsOptional,
    IsNotEmpty,
    IsString,
    ValidateNested,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// Estructura SOAP para narrativa clínica
export class ClinicalNarrativeDto {
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    subjectiveReport?: string; // Lo que reporta el paciente

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    objectiveObservation?: string; // Observaciones del terapeuta

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    assessment?: string; // Evaluación clínica

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    plan?: string; // Plan de tratamiento

    @IsOptional()
    @IsString()
    @MaxLength(5000)
    additionalNotes?: string; // Notas adicionales
}

export class CreateSessionDto {
    @IsUUID('4', { message: 'appointmentId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'appointmentId es requerido' })
    appointmentId: string;

    @IsDateString({}, { message: 'startedAt debe ser una fecha ISO 8601 válida' })
    @IsNotEmpty({ message: 'startedAt es requerido' })
    startedAt: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ClinicalNarrativeDto)
    clinicalNarrative?: ClinicalNarrativeDto;
}
