// src/common/filters/global-exception.filter.spec.ts
/**
 * Tests for GlobalExceptionFilter
 * 
 * Covers critical HTTP codes:
 * - 400 Bad Request (DTO validation)
 * - 403 Forbidden (access denied)
 * - 409 Conflict (signed session)
 * - 410 Gone (soft delete)
 * - 423 Locked (legal hold)
 */

import {
    HttpException,
    HttpStatus,
    ForbiddenException,
    ConflictException,
    GoneException,
    BadRequestException,
    NotFoundException,
    ArgumentsHost,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

// Custom 423 Locked Exception (NestJS doesn't have built-in)
class LockedException extends HttpException {
    constructor(message: string = 'Resource is locked') {
        super(message, 423);
    }
}

describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;
    let mockGetResponse: jest.Mock;
    let mockGetRequest: jest.Mock;
    let mockHost: Partial<ArgumentsHost>;

    beforeEach(() => {
        process.env.NODE_ENV = 'test';

        filter = new GlobalExceptionFilter();

        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
        mockGetRequest = jest.fn().mockReturnValue({ method: 'GET', url: '/test' });

        mockHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: mockGetResponse,
                getRequest: mockGetRequest,
            }),
        };
    });

    const executeFilter = (exception: unknown) => {
        filter.catch(exception, mockHost as ArgumentsHost);
        return mockJson.mock.calls[0][0];
    };

    describe('Response Format', () => {
        it('should return consistent error format', () => {
            const result = executeFilter(new BadRequestException('Test error'));

            expect(result).toHaveProperty('statusCode');
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('error');
            expect(typeof result.statusCode).toBe('number');
            expect(typeof result.message).toBe('string');
            expect(typeof result.error).toBe('string');
        });
    });

    describe('400 Bad Request', () => {
        it('should handle BadRequestException', () => {
            const result = executeFilter(new BadRequestException('Invalid data'));

            expect(result.statusCode).toBe(400);
            expect(result.error).toBe('Bad Request');
            expect(result.message).toBe('Invalid data');
            expect(mockStatus).toHaveBeenCalledWith(400);
        });
    });

    describe('403 Forbidden', () => {
        it('should handle ForbiddenException', () => {
            const result = executeFilter(
                new ForbiddenException('Solo el terapeuta asignado puede firmar'),
            );

            expect(result.statusCode).toBe(403);
            expect(result.error).toBe('Forbidden');
            expect(result.message).toBe('Solo el terapeuta asignado puede firmar');
            expect(mockStatus).toHaveBeenCalledWith(403);
        });
    });

    describe('409 Conflict', () => {
        it('should handle signed session conflict', () => {
            const result = executeFilter(
                new ConflictException('Sesión firmada no puede modificarse'),
            );

            expect(result.statusCode).toBe(409);
            expect(result.error).toBe('Conflict');
            expect(result.message).toContain('no puede modificarse');
            expect(mockStatus).toHaveBeenCalledWith(409);
        });
    });

    describe('410 Gone', () => {
        it('should handle soft deleted resource', () => {
            const result = executeFilter(new GoneException('Paciente eliminado'));

            expect(result.statusCode).toBe(410);
            expect(result.error).toBe('Gone');
            expect(result.message).toBe('Paciente eliminado');
            expect(mockStatus).toHaveBeenCalledWith(410);
        });
    });

    describe('423 Locked', () => {
        it('should handle legal hold lock', () => {
            const result = executeFilter(
                new LockedException('Recurso bajo retención legal'),
            );

            expect(result.statusCode).toBe(423);
            expect(result.message).toBe('Recurso bajo retención legal');
            expect(mockStatus).toHaveBeenCalledWith(423);
        });
    });

    describe('404 Not Found', () => {
        it('should handle resource not found', () => {
            const result = executeFilter(new NotFoundException('Sesión no encontrada'));

            expect(result.statusCode).toBe(404);
            expect(result.error).toBe('Not Found');
            expect(result.message).toBe('Sesión no encontrada');
        });
    });

    describe('Prisma Errors', () => {
        it('should handle unique constraint violation (P2002)', () => {
            const prismaError = { code: 'P2002', meta: { target: ['email'] } };
            const result = executeFilter(prismaError);

            expect(result.statusCode).toBe(409);
            expect(result.error).toBe('Conflict');
        });

        it('should handle record not found (P2025)', () => {
            const prismaError = { code: 'P2025' };
            const result = executeFilter(prismaError);

            expect(result.statusCode).toBe(404);
            expect(result.error).toBe('Not Found');
        });
    });

    describe('Unknown Errors', () => {
        it('should handle unknown errors safely', () => {
            const result = executeFilter(new Error('Unexpected error'));

            expect(result.statusCode).toBe(500);
            expect(result.error).toBe('Internal Server Error');
        });
    });
});
