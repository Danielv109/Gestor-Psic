import { RemindersService } from './reminders.service';
export declare class RemindersController {
    private readonly reminders;
    constructor(reminders: RemindersService);
    sendNow(req: any): Promise<{
        sent: number;
        skipped: number;
        total: number;
        reminders: any[];
    }>;
}
