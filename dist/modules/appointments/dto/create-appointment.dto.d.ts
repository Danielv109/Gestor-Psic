import { SessionType } from '@prisma/client';
export declare class CreateAppointmentDto {
    patientId: string;
    scheduledStart: string;
    scheduledEnd: string;
    sessionType?: SessionType;
    adminNotes?: string;
}
