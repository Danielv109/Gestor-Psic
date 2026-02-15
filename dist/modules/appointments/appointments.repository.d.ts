import { PrismaService } from '../../prisma/prisma.service';
import { Appointment, Prisma } from '@prisma/client';
export declare class AppointmentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Appointment | null>;
    findByPatient(patientId: string): Promise<Appointment[]>;
    findByDateRange(therapistId: string, startDate: Date, endDate: Date): Promise<Appointment[]>;
    findUpcoming(therapistId: string, limit?: number): Promise<Appointment[]>;
    create(data: Prisma.AppointmentCreateInput): Promise<Appointment>;
    update(id: string, data: Prisma.AppointmentUpdateInput): Promise<Appointment>;
    cancel(id: string, reason: string): Promise<Appointment>;
    confirm(id: string): Promise<Appointment>;
    softDelete(id: string): Promise<Appointment>;
    hasConflict(patientId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<boolean>;
}
