// src/auth/dto/refresh-token.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class TokenPairDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
