// src/modules/shadow-notes/dto/create-shadow-note.dto.ts
import { IsUUID, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateShadowNoteDto {
    @IsUUID('4', { message: 'sessionId debe ser un UUID válido' })
    @IsNotEmpty({ message: 'sessionId es requerido' })
    sessionId: string;

    @IsString()
    @IsNotEmpty({ message: 'El contenido es requerido' })
    @MinLength(1, { message: 'El contenido no puede estar vacío' })
    @MaxLength(10000, { message: 'El contenido no puede exceder 10000 caracteres' })
    content: string; // Contenido en texto plano (se cifrará)
}
