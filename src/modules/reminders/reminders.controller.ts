import { Controller, Post, Req } from '@nestjs/common';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
    constructor(private readonly reminders: RemindersService) { }

    /**
     * Manual trigger for sending reminders (for testing or urgent sends).
     */
    @Post('send-now')
    async sendNow(@Req() req: any) {
        return this.reminders.processReminders();
    }
}
