import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, UpdatePatientDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckPolicies } from '../../common/decorators/policies.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PatientAccessPolicy } from './policies/patient-access.policy';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';

@Controller('patients')
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    /**
     * POST /patients
     * Crear nuevo paciente
     * Solo TERAPEUTA y SUPERVISOR pueden crear
     */
    @Post()
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreatePatientDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.patientsService.create(dto, user);
    }

    /**
     * GET /patients/search?q=término
     * Quick search by name/externalId (max 5 results)
     * MUST be BEFORE :id route to avoid collision
     */
    @Get('search')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async quickSearch(@Query('q') query: string) {
        return this.patientsService.quickSearch(query);
    }

    /**
     * GET /patients
     * Listar pacientes del terapeuta actual
     * ABAC: Solo ve sus pacientes asignados
     */
    @Get()
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async findMyPatients(@CurrentUser() user: AuthenticatedUser) {
        return this.patientsService.findByTherapist(user.id, user);
    }

    /**
     * GET /patients/:id
     * Obtener paciente por ID
     * ABAC: Requiere colaboración activa
     */
    @Get(':id')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @CheckPolicies(PatientAccessPolicy)
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.patientsService.findById(id, user);
    }

    /**
     * GET /patients/:id/team
     * Obtener paciente con su equipo clínico
     * ABAC: Requiere colaboración activa
     */
    @Get(':id/team')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @CheckPolicies(PatientAccessPolicy)
    async findWithTeam(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.patientsService.findWithTeam(id, user);
    }

    /**
     * PUT /patients/:id
     * Actualizar paciente
     * ABAC: Requiere colaboración activa
     */
    @Put(':id')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @CheckPolicies(PatientAccessPolicy)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePatientDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.patientsService.update(id, dto, user);
    }

    /**
     * DELETE /patients/:id
     * Eliminar paciente (soft delete)
     * Solo SUPERVISOR puede eliminar
     */
    @Delete(':id')
    @Roles(GlobalRole.SUPERVISOR)
    @CheckPolicies(PatientAccessPolicy)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.patientsService.softDelete(id, user);
    }

    /**
     * PATCH /patients/:id/risk
     * Actualizar alerta de riesgo del paciente
     * Solo TERAPEUTA y SUPERVISOR pueden marcar riesgo
     */
    @Patch(':id/risk')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @CheckPolicies(PatientAccessPolicy)
    async updateRisk(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: { isHighRisk: boolean; riskLevel?: string; riskNotes?: string },
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.patientsService.updateRisk(id, dto, user);
    }

    /**
     * GET /patients/:id/briefing
     * 5-minute pre-session briefing: last plan + shadow note + pending topics
     */
    @Get(':id/briefing')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @CheckPolicies(PatientAccessPolicy)
    async getBriefing(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.patientsService.getBriefing(id, user);
    }
}
