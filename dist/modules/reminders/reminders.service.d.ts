import { PrismaService } from '../../prisma/prisma.service';
export declare class RemindersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendDailyReminders(): Promise<{
        sent: number;
        skipped: number;
        total: number;
        reminders: any[];
    }>;
    processReminders(): Promise<{
        sent: number;
        skipped: number;
        total: number;
        reminders: any[];
    }>;
}
