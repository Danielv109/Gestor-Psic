// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// Context for soft delete bypass
export interface SoftDeleteContext {
    includeDeleted?: boolean;
}

// Thread-local storage for soft delete context
const softDeleteContext = new Map<string, SoftDeleteContext>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.logger.log('Connected to database');
        this.applySoftDeleteMiddleware();
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Disconnected from database');
    }

    /**
     * Set context for current operation to include deleted records.
     * Used by AUDITOR role to access soft-deleted data.
     * 
     * @param requestId Unique request identifier
     * @param context Soft delete context options
     */
    setIncludeDeleted(requestId: string, context: SoftDeleteContext): void {
        softDeleteContext.set(requestId, context);
    }

    /**
     * Clear context after operation
     */
    clearIncludeDeleted(requestId: string): void {
        softDeleteContext.delete(requestId);
    }

    /**
     * Check if current context allows viewing deleted records
     */
    shouldIncludeDeleted(requestId?: string): boolean {
        if (!requestId) return false;
        const context = softDeleteContext.get(requestId);
        return context?.includeDeleted === true;
    }

    /**
     * Execute a query with includeDeleted flag (for AUDITOR role).
     * Automatically cleans up context after execution.
     * 
     * @example
     * const deletedPatients = await prisma.withDeletedRecords(requestId, async () => {
     *   return prisma.patient.findMany({ where: { deletedAt: { not: null } } });
     * });
     */
    async withDeletedRecords<T>(requestId: string, operation: () => Promise<T>): Promise<T> {
        this.setIncludeDeleted(requestId, { includeDeleted: true });
        try {
            return await operation();
        } finally {
            this.clearIncludeDeleted(requestId);
        }
    }

    /**
     * Middleware para soft delete automático.
     * Convierte DELETE en UPDATE con deletedAt = now()
     * Filtra automáticamente registros eliminados en queries.
     * 
     * EXCEPCIONES:
     * - AuditLog: nunca tiene soft delete (inmutable por ley)
     * - Usuarios con includeDeleted = true pueden ver eliminados
     */
    private applySoftDeleteMiddleware() {
        // Models that support soft delete
        const softDeleteModels = [
            'User',
            'Patient',
            'ClinicalCollaboration',
            'Appointment',
            'ClinicalSession',
            'ShadowNote',
        ];

        // Models that NEVER have soft delete (immutable audit trail)
        const excludedModels = [
            'AuditLog',
            'SystemConfig',
        ];

        this.$use(async (params, next) => {
            // Skip non-soft-delete models
            if (!params.model || !softDeleteModels.includes(params.model)) {
                return next(params);
            }

            // Skip excluded models (AuditLog is immutable)
            if (params.model && excludedModels.includes(params.model)) {
                return next(params);
            }

            // Check for includeDeleted flag in args
            const includeDeleted = params.args?.includeDeleted === true;

            // Filter deleted records in read queries (unless explicitly including deleted)
            if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
                params.args = params.args || {};
                params.args.where = params.args.where || {};

                // Remove our custom flag from args before passing to Prisma
                if (params.args.includeDeleted !== undefined) {
                    delete params.args.includeDeleted;
                }

                // Only add deletedAt filter if:
                // 1. Not explicitly requested to include deleted
                // 2. deletedAt not already specified in query
                if (!includeDeleted && params.args.where.deletedAt === undefined) {
                    params.args.where.deletedAt = null;
                }
            }

            // Convert delete to soft delete
            if (params.action === 'delete') {
                params.action = 'update';
                params.args.data = { deletedAt: new Date() };
            }

            if (params.action === 'deleteMany') {
                params.action = 'updateMany';
                if (params.args.data) {
                    params.args.data.deletedAt = new Date();
                } else {
                    params.args.data = { deletedAt: new Date() };
                }
            }

            return next(params);
        });

        this.logger.log('Soft delete middleware applied (excludes: AuditLog)');
    }
}
