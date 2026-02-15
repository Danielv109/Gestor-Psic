// src/modules/shadow-notes/dto/update-shadow-note.dto.ts
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateShadowNoteDto {
    @IsString()
    @IsNotEmpty({ message: 'El contenido es requerido' })
    @MinLength(1, { message: 'El contenido no puede estar vacío' })
    @MaxLength(10000, { message: 'El contenido no puede exceder 10000 caracteres' })
    content: string;
}
