import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface ClinicalErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp?: string;
    path?: string;
}
export declare class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly isProduction;
    catch(exception: unknown, host: ArgumentsHost): void;
    private extractErrorDetails;
    private extractMessage;
    private isPrismaError;
    private handlePrismaError;
}
