"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalValidationPipe = void 0;
const common_1 = require("@nestjs/common");
exports.globalValidationPipe = new common_1.ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
        enableImplicitConversion: true,
    },
    stopAtFirstError: false,
    exceptionFactory: (errors) => {
        const messages = errors.map(error => {
            const constraints = error.constraints;
            if (constraints) {
                return {
                    field: error.property,
                    errors: Object.values(constraints),
                };
            }
            return {
                field: error.property,
                errors: ['Validation failed'],
            };
        });
        return new common_1.BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation failed',
            validationErrors: messages,
        });
    },
});
//# sourceMappingURL=validation.pipe.js.map