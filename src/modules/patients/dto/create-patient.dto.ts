// src/modules/patients/dto/create-patient.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(100)
  lastName: string;

  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  dateOfBirth: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  // Flag para indicar si es menor de edad (UI helper)
  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  // Custodio (para menores)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  custodianName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  custodianPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email del custodio debe tener un formato válido' })
  @MaxLength(255)
  custodianEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  custodianRelation?: string;

  // Contacto de emergencia
  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyRelation?: string;
}
