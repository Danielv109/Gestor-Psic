"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttlerConfig = exports.THROTTLE_ERROR_MESSAGE = void 0;
exports.THROTTLE_ERROR_MESSAGE = 'Demasiadas solicitudes, intenta más tarde';
exports.throttlerConfig = {
    throttlers: [
        {
            name: 'default',
            ttl: 60000,
            limit: 60,
        },
    ],
    errorMessage: exports.THROTTLE_ERROR_MESSAGE,
};
//# sourceMappingURL=throttler.config.js.map