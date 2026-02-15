"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const ERROR_MESSAGES = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    410: 'Gone',
    423: 'Locked',
    500: 'Internal Server Error',
};
const CLINICAL_ERROR_CONTEXT = {
    403: 'No tiene permisos para realizar esta acción',
    409: 'Conflicto: el recurso no puede modificarse en su estado actual',
    410: 'Recurso eliminado o no disponible',
    423: 'Recurso bloqueado por retención legal',
};
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
        this.isProduction = process.env.NODE_ENV === 'production';
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const { statusCode, message, error } = this.extractErrorDetails(exception);
        if (this.isProduction) {
            this.logger.error(`[${statusCode}] ${request.method} ${request.url} - ${message}`);
        }
        else {
            this.logger.error(`[${statusCode}] ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : String(exception));
        }
        const errorResponse = {
            statusCode,
            message,
            error,
        };
        if (!this.isProduction) {
            errorResponse.timestamp = new Date().toISOString();
            errorResponse.path = request.url;
        }
        response.status(statusCode).json(errorResponse);
    }
    extractErrorDetails(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            let message;
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse;
                message = this.extractMessage(resp);
            }
            else {
                message = exception.message;
            }
            return {
                statusCode: status,
                message: message,
                error: ERROR_MESSAGES[status] || 'Error',
            };
        }
        if (this.isPrismaError(exception)) {
            return this.handlePrismaError(exception);
        }
        const message = this.isProduction
            ? 'Error interno del servidor'
            : exception instanceof Error
                ? exception.message
                : 'Unknown error';
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message,
            error: 'Internal Server Error',
        };
    }
    extractMessage(response) {
        if (response.validationErrors) {
            return 'Validation failed';
        }
        if (typeof response.message === 'string') {
            return response.message;
        }
        if (Array.isArray(response.message)) {
            return response.message.join(', ');
        }
        return 'An error occurred';
    }
    isPrismaError(exception) {
        if (exception !== null &&
            typeof exception === 'object' &&
            'code' in exception) {
            const code = exception.code;
            return typeof code === 'string' && code.startsWith('P');
        }
        return false;
    }
    handlePrismaError(exception) {
        const prismaError = exception;
        switch (prismaError.code) {
            case 'P2002':
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    message: 'El recurso ya existe',
                    error: 'Conflict',
                };
            case 'P2025':
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: 'Recurso no encontrado',
                    error: 'Not Found',
                };
            case 'P2003':
                return {
                    statusCode: common_1.HttpStatus.BAD_REQUEST,
                    message: 'Referencia a recurso inválida',
                    error: 'Bad Request',
                };
            default:
                return {
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    message: this.isProduction ? 'Error de base de datos' : `Prisma error: ${prismaError.code}`,
                    error: 'Internal Server Error',
                };
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map