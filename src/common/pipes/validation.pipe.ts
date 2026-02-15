// src/common/pipes/validation.pipe.ts
/**
 * Global Validation Pipe Configuration
 * 
 * Settings:
 * - whitelist: true → strips extra properties
 * - forbidNonWhitelisted: true → throws error on extra properties
 * - transform: true → transforms payloads to DTO instances
 * - stopAtFirstError: false → returns all validation errors
 */

import { ValidationPipe, BadRequestException, ValidationError } from '@nestjs/common';

export const globalValidationPipe = new ValidationPipe({
    // Strip properties not defined in DTO
    whitelist: true,

    // Throw error if extra properties are sent
    forbidNonWhitelisted: true,

    // Transform payload to DTO instance
    transform: true,
    transformOptions: {
        enableImplicitConversion: true,
    },

    // Return all validation errors, not just first
    stopAtFirstError: false,

    // Custom error formatting for clinical system
    exceptionFactory: (errors: ValidationError[]) => {
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

        return new BadRequestException({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation failed',
            validationErrors: messages,
        });
    },
});
