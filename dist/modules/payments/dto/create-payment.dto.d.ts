import { PaymentMethod } from '@prisma/client';
export declare class CreatePaymentDto {
    sessionId: string;
    amount: number;
    method?: PaymentMethod;
    notes?: string;
}
