// src/auth/dto/login.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'El email debe tener un formato válido' })
    @IsNotEmpty({ message: 'El email es requerido' })
    @MaxLength(255)
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña es requerida' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @MaxLength(100)
    password: string;
}

export class LoginResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        globalRole: string;
    };
}
