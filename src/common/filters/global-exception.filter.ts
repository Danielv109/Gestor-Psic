// src/common/filters/global-exception.filter.ts
/**
 * Global Exception Filter for Clinical System
 * 
 * Unifies ALL HTTP errors with consistent format:
 * { statusCode, message, error }
 * 
 * NEVER exposes stacktrace in production.
 */

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Clinical error codes with Spanish messages
const ERROR_MESSAGES: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    410: 'Gone',
    423: 'Locked',
    500: 'Internal Server Error',
};

// Clinical-specific error descriptions
const CLINICAL_ERROR_CONTEXT: Record<number, string> = {
    403: 'No tiene permisos para realizar esta acción',
    409: 'Conflicto: el recurso no puede modificarse en su estado actual',
    410: 'Recurso eliminado o no disponible',
    423: 'Recurso bloqueado por retención legal',
};

export interface ClinicalErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp?: string;
    path?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
    private readonly isProduction = process.env.NODE_ENV === 'production';

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { statusCode, message, error } = this.extractErrorDetails(exception);

        // Log full error in development, sanitized in production
        if (this.isProduction) {
            this.logger.error(
                `[${statusCode}] ${request.method} ${request.url} - ${message}`,
            );
        } else {
            this.logger.error(
                `[${statusCode}] ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        const errorResponse: ClinicalErrorResponse = {
            statusCode,
            message,
            error,
        };

        // Add metadata only in non-production
        if (!this.isProduction) {
            errorResponse.timestamp = new Date().toISOString();
            errorResponse.path = request.url;
        }

        response.status(statusCode).json(errorResponse);
    }

    private extractErrorDetails(exception: unknown): {
        statusCode: number;
        message: string;
        error: string;
    } {
        // Handle HttpException (NestJS standard)
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            let message: string;
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse as Record<string, unknown>;
                message = this.extractMessage(resp);
            } else {
                message = exception.message;
            }

            return {
                statusCode: status,
                message: message,
                error: ERROR_MESSAGES[status] || 'Error',
            };
        }

        // Handle Prisma errors
        if (this.isPrismaError(exception)) {
            return this.handlePrismaError(exception);
        }

        // Handle unknown errors - don't expose details in production
        const message = this.isProduction
            ? 'Error interno del servidor'
            : exception instanceof Error
                ? exception.message
                : 'Unknown error';

        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message,
            error: 'Internal Server Error',
        };
    }

    private extractMessage(response: Record<string, unknown>): string {
        // Handle ValidationPipe errors
        if (response.validationErrors) {
            return 'Validation failed';
        }

        // Handle standard NestJS error format
        if (typeof response.message === 'string') {
            return response.message;
        }

        // Handle array of messages (validation errors)
        if (Array.isArray(response.message)) {
            return response.message.join(', ');
        }

        return 'An error occurred';
    }

    private isPrismaError(exception: unknown): boolean {
        if (
            exception !== null &&
            typeof exception === 'object' &&
            'code' in exception
        ) {
            const code = (exception as Record<string, unknown>).code;
            return typeof code === 'string' && code.startsWith('P');
        }
        return false;
    }

    private handlePrismaError(exception: unknown): {
        statusCode: number;
        message: string;
        error: string;
    } {
        const prismaError = exception as { code: string; meta?: Record<string, unknown> };

        switch (prismaError.code) {
            case 'P2002': // Unique constraint violation
                return {
                    statusCode: HttpStatus.CONFLICT,
                    message: 'El recurso ya existe',
                    error: 'Conflict',
                };
            case 'P2025': // Record not found
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'Recurso no encontrado',
                    error: 'Not Found',
                };
            case 'P2003': // Foreign key constraint violation
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Referencia a recurso inválida',
                    error: 'Bad Request',
                };
            default:
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: this.isProduction ? 'Error de base de datos' : `Prisma error: ${prismaError.code}`,
                    error: 'Internal Server Error',
                };
        }
    }
}
