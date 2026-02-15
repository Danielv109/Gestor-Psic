import { IsNumber, IsOptional, IsString, IsEnum, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    amountPaid?: number;

    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;

    @IsOptional()
    @IsString()
    notes?: string;
}
