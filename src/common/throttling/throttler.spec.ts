// src/common/throttling/throttler.spec.ts
/**
 * Tests for Rate Limiting Configuration
 * 
 * Verifies throttle limits are correctly configured:
 * - Login: 5 req/min
 * - Refresh: 10 req/min
 * - Export: 3 req/5min
 * - Bootstrap: 1 req/24h
 */

import {
    throttlers,
    THROTTLE_LOGIN,
    THROTTLE_REFRESH,
    THROTTLE_EXPORT,
    THROTTLE_BOOTSTRAP,
    THROTTLE_ERROR_MESSAGE,
} from './throttler.config';

describe('Throttler Configuration', () => {
    describe('Configuration Values', () => {
        it('should have login throttle: 5 req/min', () => {
            const loginThrottler = throttlers.find(t => t.name === THROTTLE_LOGIN);
            expect(loginThrottler).toBeDefined();
            expect(loginThrottler?.limit).toBe(5);
            expect(loginThrottler?.ttl).toBe(60000);
        });

        it('should have refresh throttle: 10 req/min', () => {
            const refreshThrottler = throttlers.find(t => t.name === THROTTLE_REFRESH);
            expect(refreshThrottler).toBeDefined();
            expect(refreshThrottler?.limit).toBe(10);
            expect(refreshThrottler?.ttl).toBe(60000);
        });

        it('should have export throttle: 3 req/5min', () => {
            const exportThrottler = throttlers.find(t => t.name === THROTTLE_EXPORT);
            expect(exportThrottler).toBeDefined();
            expect(exportThrottler?.limit).toBe(3);
            expect(exportThrottler?.ttl).toBe(300000);
        });

        it('should have bootstrap throttle: 1 req/24h', () => {
            const bootstrapThrottler = throttlers.find(t => t.name === THROTTLE_BOOTSTRAP);
            expect(bootstrapThrottler).toBeDefined();
            expect(bootstrapThrottler?.limit).toBe(1);
            expect(bootstrapThrottler?.ttl).toBe(86400000);
        });
    });

    describe('Error Message', () => {
        it('should have Spanish error message for 429', () => {
            expect(THROTTLE_ERROR_MESSAGE).toBe('Demasiadas solicitudes, intenta más tarde');
        });
    });
});
