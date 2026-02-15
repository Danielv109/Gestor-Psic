import { PaymentMethod, PaymentStatus } from '@prisma/client';
export declare class UpdatePaymentDto {
    amountPaid?: number;
    status?: PaymentStatus;
    method?: PaymentMethod;
    notes?: string;
}
