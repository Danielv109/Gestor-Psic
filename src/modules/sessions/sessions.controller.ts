// src/modules/sessions/sessions.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    ParseUUIDPipe,
    ParseBoolPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto, SignSessionDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckPolicies } from '../../common/decorators/policies.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SessionAccessPolicy } from './policies/session-access.policy';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';

@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    /**
     * POST /sessions
     * Crear nueva sesión clínica
     * Solo TERAPEUTA
     */
    @Post()
    @Roles(GlobalRole.TERAPEUTA)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateSessionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.create(dto, user);
    }

    /**
     * GET /sessions
     * Listar sesiones del terapeuta
     */
    @Get()
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    async findMySessions(
        @Query('isDraft', new ParseBoolPipe({ optional: true })) isDraft: boolean | undefined,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.findByTherapist(user, isDraft);
    }

    /**
     * GET /sessions/patient/:patientId
     * Historial de sesiones de un paciente
     */
    @Get('patient/:patientId')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    async findByPatient(
        @Param('patientId', ParseUUIDPipe) patientId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.findByPatient(patientId, user);
    }

    /**
     * GET /sessions/:id
     * Obtener sesión por ID (incluye narrativa descifrada)
     */
    @Get(':id')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @CheckPolicies(SessionAccessPolicy)
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.findById(id, user);
    }

    /**
     * GET /sessions/:id/versions
     * Obtener historial de versiones
     */
    @Get(':id/versions')
    @Roles(GlobalRole.TERAPEUTA, GlobalRole.SUPERVISOR)
    @CheckPolicies(SessionAccessPolicy)
    async getVersions(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.getVersions(id, user);
    }

    /**
     * PUT /sessions/:id
     * Actualizar sesión (solo si no está firmada)
     */
    @Put(':id')
    @Roles(GlobalRole.TERAPEUTA)
    @CheckPolicies(SessionAccessPolicy)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateSessionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.update(id, dto, user);
    }

    /**
     * POST /sessions/:id/sign
     * Firmar sesión (la bloquea permanentemente)
     */
    @Post(':id/sign')
    @Roles(GlobalRole.TERAPEUTA)
    @CheckPolicies(SessionAccessPolicy)
    async sign(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SignSessionDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.sessionsService.sign(id, dto, user);
    }
}
