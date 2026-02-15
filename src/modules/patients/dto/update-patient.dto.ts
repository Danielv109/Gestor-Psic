// src/modules/patients/dto/update-patient.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
