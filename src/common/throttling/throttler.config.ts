// src/common/throttling/throttler.config.ts
/**
 * Rate Limiting Configuration for Clinical System
 * 
 * Single default throttler with reasonable global limit.
 * Controllers override per-route with @Throttle({ default: { limit, ttl } })
 * 
 * Per-route limits (applied via @Throttle decorator):
 * - POST /auth/login: 5 req/min
 * - POST /auth/refresh: 10 req/min
 * - POST /export/*: 3 req/5min
 * - POST /system/bootstrap: 1 req/24h
 */

// Error message for 429 responses
export const THROTTLE_ERROR_MESSAGE = 'Demasiadas solicitudes, intenta más tarde';

// Module configuration - single default throttler
export const throttlerConfig = {
    throttlers: [
        {
            name: 'default',
            ttl: 60000, // 1 minute
            limit: 60,  // 60 req/min global default (generous for normal use)
        },
    ],
    errorMessage: THROTTLE_ERROR_MESSAGE,
};
