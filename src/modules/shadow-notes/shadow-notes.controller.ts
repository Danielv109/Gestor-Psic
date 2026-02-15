// src/modules/shadow-notes/shadow-notes.controller.ts
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
import { ShadowNotesService } from './shadow-notes.service';
import { CreateShadowNoteDto, UpdateShadowNoteDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CheckPolicies } from '../../common/decorators/policies.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ShadowNoteOwnerPolicy } from './policies/shadow-note-owner.policy';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { GlobalRole } from '@prisma/client';

@Controller('shadow-notes')
export class ShadowNotesController {
    constructor(private readonly shadowNotesService: ShadowNotesService) { }

    /**
     * POST /shadow-notes
     * Crear nota sombra para una sesión
     * Solo TERAPEUTA (y solo para sus propias sesiones)
     */
    @Post()
    @Roles(GlobalRole.TERAPEUTA)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateShadowNoteDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.shadowNotesService.create(dto, user);
    }

    /**
     * GET /shadow-notes
     * Listar mis notas sombra (solo metadatos)
     */
    @Get()
    @Roles(GlobalRole.TERAPEUTA)
    async findMyNotes(@CurrentUser() user: AuthenticatedUser) {
        return this.shadowNotesService.findMyNotes(user);
    }

    /**
     * GET /shadow-notes/session/:sessionId
     * Obtener nota sombra de una sesión específica
     */
    @Get('session/:sessionId')
    @Roles(GlobalRole.TERAPEUTA)
    async findBySession(
        @Param('sessionId', ParseUUIDPipe) sessionId: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.shadowNotesService.findBySession(sessionId, user);
    }

    /**
     * GET /shadow-notes/:id
     * Obtener nota sombra por ID (incluye contenido descifrado)
     * Solo accesible por el propietario
     */
    @Get(':id')
    @Roles(GlobalRole.TERAPEUTA)
    @CheckPolicies(ShadowNoteOwnerPolicy)
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.shadowNotesService.findById(id, user);
    }

    /**
     * PUT /shadow-notes/:id
     * Actualizar nota sombra
     * Solo accesible por el propietario
     */
    @Put(':id')
    @Roles(GlobalRole.TERAPEUTA)
    @CheckPolicies(ShadowNoteOwnerPolicy)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateShadowNoteDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.shadowNotesService.update(id, dto, user);
    }

    /**
     * DELETE /shadow-notes/:id
     * Eliminar nota sombra (soft delete)
     * Solo accesible por el propietario
     */
    @Delete(':id')
    @Roles(GlobalRole.TERAPEUTA)
    @CheckPolicies(ShadowNoteOwnerPolicy)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        await this.shadowNotesService.softDelete(id, user);
    }
}
