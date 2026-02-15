import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export interface SoftDeleteContext {
    includeDeleted?: boolean;
}
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    setIncludeDeleted(requestId: string, context: SoftDeleteContext): void;
    clearIncludeDeleted(requestId: string): void;
    shouldIncludeDeleted(requestId?: string): boolean;
    withDeletedRecords<T>(requestId: string, operation: () => Promise<T>): Promise<T>;
    private applySoftDeleteMiddleware;
}
