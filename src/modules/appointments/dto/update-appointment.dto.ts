// src/modules/appointments/dto/update-appointment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsEnum, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
    @IsOptional()
    @IsEnum(AppointmentStatus, { message: 'status debe ser un estado de cita válido' })
    status?: AppointmentStatus;
}

export class CancelAppointmentDto {
    @IsString()
    @IsNotEmpty({ message: 'cancelReason es requerido' })
    @MaxLength(255)
    cancelReason: string;
}
