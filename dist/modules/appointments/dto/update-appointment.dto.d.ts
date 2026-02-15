import { CreateAppointmentDto } from './create-appointment.dto';
import { AppointmentStatus } from '@prisma/client';
declare const UpdateAppointmentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAppointmentDto>>;
export declare class UpdateAppointmentDto extends UpdateAppointmentDto_base {
    status?: AppointmentStatus;
}
export declare class CancelAppointmentDto {
    cancelReason: string;
}
export {};
