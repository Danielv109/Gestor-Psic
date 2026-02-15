// src/common/throttling/throttler.module.ts
/**
 * Throttler Module for Rate Limiting
 */

import { Module, Global } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from './throttler.config';

@Global()
@Module({
    imports: [ThrottlerModule.forRoot(throttlerConfig)],
    exports: [ThrottlerModule],
})
export class AppThrottlerModule { }
