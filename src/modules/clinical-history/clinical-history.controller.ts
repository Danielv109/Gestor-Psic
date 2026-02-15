// src/modules/clinical-history/clinical-history.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ClinicalHistoryService } from './clinical-history.service';
import { CreateClinicalHistoryDto, UpdateClinicalHistoryDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Controller('clinical-history')
export class ClinicalHistoryController {
    constructor(private readonly service: ClinicalHistoryService) { }

    /**
     * POST /clinical-history
     * Crear historia clínica para un paciente
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateClinicalHistoryDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.service.create(dto, user);
    }

    /**
     * GET /clinical-history/patient/:patientId
     * Obtener historia clínica de un paciente
     */
    @Get('patient/:patientId')
    async findByPatient(
        @Param('patientId', ParseUUIDPipe) patientId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.service.findByPatientId(patientId, user);
    }

    /**
     * PUT /clinical-history/:id
     * Actualizar historia clínica
     */
    @Put(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateClinicalHistoryDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.service.update(id, dto, user);
    }
}
