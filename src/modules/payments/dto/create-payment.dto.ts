import { IsUUID, IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
    @IsUUID()
    sessionId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    amount: number;

    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;

    @IsOptional()
    @IsString()
    notes?: string;
}
