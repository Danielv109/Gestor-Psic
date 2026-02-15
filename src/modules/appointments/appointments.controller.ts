// src/modules/appointments/appointments.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentDto, CancelAppointmentDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckPolicies } from '../../common/decorators/policies.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppointmentAccessPolicy } from './policies/appointment-access.policy';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    /**
     * POST /appointments
     * Crear nueva cita
     */
    @Post()
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateAppointmentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.appointmentsService.create(dto, user);
    }

    /**
     * GET /appointments/upcoming
     * Listar próximas citas del terapeuta
     */
    @Get('upcoming')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async findUpcoming(@CurrentUser() user: AuthenticatedUser) {
        return this.appointmentsService.findMyUpcoming(user);
    }

    /**
     * GET /appointments/range?start=YYYY-MM-DD&end=YYYY-MM-DD
     * Listar citas en rango de fechas
     */
    @Get('range')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    async findByRange(
        @Query('start') start: string,
        @Query('end') end: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.appointmentsService.findByDateRange(start, end, user);
    }

    /**
     * GET /appointments/:id
     * Obtener cita por ID
     */
    @Get(':id')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @CheckPolicies(AppointmentAccessPolicy)
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.appointmentsService.findById(id, user);
    }

    /**
     * PUT /appointments/:id
     * Actualizar cita
     */
    @Put(':id')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @CheckPolicies(AppointmentAccessPolicy)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAppointmentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.appointmentsService.update(id, dto, user);
    }

    /**
     * POST /appointments/:id/confirm
     * Confirmar cita
     */
    @Post(':id/confirm')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @CheckPolicies(AppointmentAccessPolicy)
    async confirm(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.appointmentsService.confirm(id, user);
    }

    /**
     * POST /appointments/:id/cancel
     * Cancelar cita (requiere razón)
     */
    @Post(':id/cancel')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR, GlobalRole.ASISTENTE)
    @CheckPolicies(AppointmentAccessPolicy)
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelAppointmentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.appointmentsService.cancel(id, dto, user);
    }

    /**
     * DELETE /appointments/:id
     * Eliminar cita (soft delete)
     * Solo SUPERVISOR
     */
    @Delete(':id')
    @Roles(GlobalRole.SUPERVISOR)
    @CheckPolicies(AppointmentAccessPolicy)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.appointmentsService.softDelete(id, user);
    }
}
