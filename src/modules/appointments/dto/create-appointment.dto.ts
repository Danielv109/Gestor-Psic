// src/modules/appointments/dto/create-appointment.dto.ts
import {
    IsString,
    IsUUID,
    IsDateString,
    IsEnum,
    IsOptional,
    IsNotEmpty,
    MaxLength,
} from 'class-validator';
import { SessionType } from '@prisma/client';

export class CreateAppointmentDto {
    @IsUUID('4', { message: 'patientId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'patientId es requerido' })
    patientId: string;

    @IsDateString({}, { message: 'scheduledStart debe ser una fecha ISO 8601 válida' })
    @IsNotEmpty({ message: 'scheduledStart es requerido' })
    scheduledStart: string;

    @IsDateString({}, { message: 'scheduledEnd debe ser una fecha ISO 8601 válida' })
    @IsNotEmpty({ message: 'scheduledEnd es requerido' })
    scheduledEnd: string;

    @IsOptional()
    @IsEnum(SessionType, { message: 'sessionType debe ser un tipo de sesión válido' })
    sessionType?: SessionType;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    adminNotes?: string;
}
