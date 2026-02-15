// src/modules/audit/audit.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AuditLogInput } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditResource, GlobalRole } from '@prisma/client';
import { mockPrismaService } from '../../test/test-utils';

describe('AuditService', () => {
    let service: AuditService;
    let prisma: ReturnType<typeof mockPrismaService>;

    beforeEach(async () => {
        prisma = mockPrismaService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('log', () => {
        it('should create audit log entry', async () => {
            const input: AuditLogInput = {
                actorId: 'user-uuid-001',
                actorRole: GlobalRole.TERAPEUTA,
                actorIp: '192.168.1.100',
                action: AuditAction.READ,
                resource: AuditResource.PATIENT,
                resourceId: 'patient-uuid-001',
                patientId: 'patient-uuid-001',
                success: true,
            };

            await service.log(input);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    actorId: 'user-uuid-001',
                    actorRole: GlobalRole.TERAPEUTA,
                    action: AuditAction.READ,
                    resource: AuditResource.PATIENT,
                    success: true,
                }),
            });
        });

        it('should sanitize sensitive data in details', async () => {
            const input: AuditLogInput = {
                actorId: 'user-uuid-001',
                actorIp: '192.168.1.100',
                action: AuditAction.CREATE,
                resource: AuditResource.USER,
                resourceId: 'user-uuid-002',
                details: {
                    email: 'test@example.com',
                    password: 'secret123',
                    token: 'jwt-token-here',
                    secretKey: 'api-key',
                    narrative: 'Clinical narrative content',
                    noteContent: 'Shadow note content',
                    normalField: 'visible value',
                },
            };

            await service.log(input);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    details: expect.objectContaining({
                        email: 'test@example.com', // Not sensitive
                        password: '[REDACTED]',
                        token: '[REDACTED]',
                        secretKey: '[REDACTED]',
                        narrative: '[REDACTED]',
                        noteContent: '[REDACTED]',
                        normalField: 'visible value',
                    }),
                }),
            });
        });

        it('should default success to true if not provided', async () => {
            const input: AuditLogInput = {
                actorId: 'user-uuid-001',
                actorIp: '192.168.1.100',
                action: AuditAction.READ,
                resource: AuditResource.PATIENT,
                resourceId: 'patient-uuid-001',
            };

            await service.log(input);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    success: true,
                }),
            });
        });

        it('should handle null actorId for system events', async () => {
            const input: AuditLogInput = {
                actorId: undefined,
                actorIp: 'system',
                action: AuditAction.CREATE,
                resource: AuditResource.CLINICAL_SESSION,
                resourceId: 'session-uuid-001',
            };

            await service.log(input);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    actorId: undefined,
                }),
            });
        });
    });

    describe('logAccessDenied', () => {
        it('should log access denied event with failure reason', async () => {
            await service.logAccessDenied({
                actorId: 'intruder-uuid',
                actorIp: '10.0.0.1',
                resource: AuditResource.SHADOW_NOTE,
                resourceId: 'note-uuid-001',
                reason: 'No es propietario de la nota sombra',
            });

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    actorId: 'intruder-uuid',
                    action: AuditAction.ACCESS_DENIED,
                    resource: AuditResource.SHADOW_NOTE,
                    success: false,
                    failureReason: 'No es propietario de la nota sombra',
                }),
            });
        });

        it('should log access denied without actorId for anonymous attempts', async () => {
            await service.logAccessDenied({
                actorId: undefined,
                actorIp: '10.0.0.1',
                resource: AuditResource.PATIENT,
                resourceId: 'patient-uuid-001',
                reason: 'Token inválido',
            });

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    actorId: undefined,
                    action: AuditAction.ACCESS_DENIED,
                }),
            });
        });
    });

    describe('findByPatient', () => {
        it('should query audit logs by patient ID', async () => {
            const mockLogs = [
                { id: 'log-1', patientId: 'patient-uuid-001', action: AuditAction.READ },
                { id: 'log-2', patientId: 'patient-uuid-001', action: AuditAction.UPDATE },
            ];
            prisma.auditLog.findMany.mockResolvedValue(mockLogs);

            const result = await service.findByPatient('patient-uuid-001');

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    patientId: 'patient-uuid-001',
                    timestamp: {
                        gte: undefined,
                        lte: undefined,
                    },
                },
                orderBy: { timestamp: 'desc' },
                skip: undefined,
                take: undefined,
            });
            expect(result).toEqual(mockLogs);
        });

        it('should apply date filters', async () => {
            const startDate = new Date('2026-01-01');
            const endDate = new Date('2026-01-31');

            await service.findByPatient('patient-uuid-001', { startDate, endDate });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    patientId: 'patient-uuid-001',
                    timestamp: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: { timestamp: 'desc' },
                skip: undefined,
                take: undefined,
            });
        });

        it('should apply pagination', async () => {
            await service.findByPatient('patient-uuid-001', { skip: 10, take: 20 });

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 20,
                })
            );
        });
    });

    describe('findByActor', () => {
        it('should query audit logs by actor ID', async () => {
            const mockLogs = [
                { id: 'log-1', actorId: 'user-uuid-001', action: AuditAction.LOGIN },
                { id: 'log-2', actorId: 'user-uuid-001', action: AuditAction.READ },
            ];
            prisma.auditLog.findMany.mockResolvedValue(mockLogs);

            const result = await service.findByActor('user-uuid-001');

            expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
                where: {
                    actorId: 'user-uuid-001',
                    timestamp: {
                        gte: undefined,
                        lte: undefined,
                    },
                },
                orderBy: { timestamp: 'desc' },
                skip: undefined,
                take: undefined,
            });
            expect(result).toEqual(mockLogs);
        });
    });

    // =========================================================
    // CRITICAL TEST: Audit logs are IMMUTABLE
    // =========================================================
    describe('immutability', () => {
        it('should NOT have a delete method', () => {
            // AuditService should not expose any delete functionality
            expect((service as any).delete).toBeUndefined();
            expect((service as any).softDelete).toBeUndefined();
            expect((service as any).remove).toBeUndefined();
        });

        it('should NOT have an update method', () => {
            // AuditService should not expose any update functionality
            expect((service as any).update).toBeUndefined();
            expect((service as any).edit).toBeUndefined();
            expect((service as any).modify).toBeUndefined();
        });
    });

    describe('sanitization edge cases', () => {
        it('should handle nested objects in details', async () => {
            const input: AuditLogInput = {
                actorId: 'user-uuid-001',
                actorIp: '192.168.1.100',
                action: AuditAction.CREATE,
                resource: AuditResource.USER,
                resourceId: 'user-uuid-002',
                details: {
                    user: {
                        email: 'test@example.com',
                        password: 'secret123',
                    },
                },
            };

            await service.log(input);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    details: expect.objectContaining({
                        user: expect.objectContaining({
                            email: 'test@example.com',
                            password: '[REDACTED]',
                        }),
                    }),
                }),
            });
        });

        it('should handle undefined details', async () => {
            const input: AuditLogInput = {
                actorId: 'user-uuid-001',
                actorIp: '192.168.1.100',
                action: AuditAction.READ,
                resource: AuditResource.PATIENT,
                resourceId: 'patient-uuid-001',
                details: undefined,
            };

            await service.log(input);

            expect(prisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    details: undefined,
                }),
            });
        });
    });
});
