// src/modules/system/system-bootstrap.service.spec.ts
/**
 * Tests for System Bootstrap Service
 * 
 * Tests cover:
 * - Happy path: successful bootstrap
 * - Invalid token
 * - Double bootstrap attempt (410 GONE)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoneException, ConflictException } from '@nestjs/common';
import { SystemBootstrapService } from './system-bootstrap.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GlobalRole } from '@prisma/client';
import { BOOTSTRAP_COMPLETED_KEY } from './interfaces/bootstrap.interfaces';

describe('SystemBootstrapService', () => {
    let service: SystemBootstrapService;
    let prisma: jest.Mocked<PrismaService>;
    let configService: jest.Mocked<ConfigService>;
    let auditService: jest.Mocked<AuditService>;

    const mockPrisma = {
        systemConfig: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        user: {
            count: jest.fn(),
            create: jest.fn(),
        },
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockAuditService = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SystemBootstrapService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: ConfigService, useValue: mockConfigService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<SystemBootstrapService>(SystemBootstrapService);
        prisma = module.get(PrismaService);
        configService = module.get(ConfigService);
        auditService = module.get(AuditService);
    });

    describe('isBootstrapEnabled', () => {
        it('returns true when SYSTEM_SETUP_TOKEN is set', () => {
            mockConfigService.get.mockReturnValue('secure-token-123');
            expect(service.isBootstrapEnabled()).toBe(true);
        });

        it('returns false when SYSTEM_SETUP_TOKEN is not set', () => {
            mockConfigService.get.mockReturnValue(undefined);
            expect(service.isBootstrapEnabled()).toBe(false);
        });

        it('returns false when SYSTEM_SETUP_TOKEN is empty', () => {
            mockConfigService.get.mockReturnValue('');
            expect(service.isBootstrapEnabled()).toBe(false);
        });
    });

    describe('validateSetupToken', () => {
        it('returns true for valid token', () => {
            mockConfigService.get.mockReturnValue('secure-token-123');
            expect(service.validateSetupToken('secure-token-123')).toBe(true);
        });

        it('returns false for invalid token', () => {
            mockConfigService.get.mockReturnValue('secure-token-123');
            expect(service.validateSetupToken('wrong-token')).toBe(false);
        });

        it('returns false when no env token configured', () => {
            mockConfigService.get.mockReturnValue(undefined);
            expect(service.validateSetupToken('any-token')).toBe(false);
        });
    });

    describe('isBootstrapCompleted', () => {
        it('returns true when bootstrap flag exists', async () => {
            mockPrisma.systemConfig.findUnique.mockResolvedValue({
                key: BOOTSTRAP_COMPLETED_KEY,
                value: 'true',
            });

            const result = await service.isBootstrapCompleted();
            expect(result).toBe(true);
        });

        it('returns false when bootstrap flag does not exist', async () => {
            mockPrisma.systemConfig.findUnique.mockResolvedValue(null);

            const result = await service.isBootstrapCompleted();
            expect(result).toBe(false);
        });
    });

    describe('executeBootstrap', () => {
        const validDto = {
            email: 'admin@syntegra.com',
            password: 'SecurePassword123!',
            firstName: 'Admin',
            lastName: 'User',
            licenseNumber: 'CED-12345',
        };

        it('HAPPY PATH: creates first user successfully', async () => {
            // Setup: no existing users, no bootstrap flag
            mockPrisma.systemConfig.findUnique.mockResolvedValue(null);
            mockPrisma.user.count.mockResolvedValue(0);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-uuid-001',
                email: 'admin@syntegra.com',
                globalRole: GlobalRole.SUPERVISOR,
                firstName: 'Admin',
                lastName: 'User',
            });
            mockPrisma.systemConfig.create.mockResolvedValue({
                key: BOOTSTRAP_COMPLETED_KEY,
                value: 'true',
            });
            mockAuditService.log.mockResolvedValue(undefined);

            const result = await service.executeBootstrap(
                validDto,
                '192.168.1.1',
                'Mozilla/5.0',
            );

            expect(result.success).toBe(true);
            expect(result.user.globalRole).toBe(GlobalRole.SUPERVISOR);
            expect(mockPrisma.user.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        globalRole: GlobalRole.SUPERVISOR,
                    }),
                }),
            );
            expect(mockPrisma.systemConfig.create).toHaveBeenCalled();
            expect(mockAuditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'CREATE',
                    details: expect.objectContaining({
                        event: 'BOOTSTRAP_COMPLETED',
                    }),
                }),
            );
        });

        it('DOUBLE ATTEMPT: throws GoneException if bootstrap already completed', async () => {
            mockPrisma.systemConfig.findUnique.mockResolvedValue({
                key: BOOTSTRAP_COMPLETED_KEY,
                value: 'true',
            });

            await expect(
                service.executeBootstrap(validDto, '192.168.1.1', 'Mozilla/5.0'),
            ).rejects.toThrow(GoneException);

            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });

        it('throws ConflictException if users already exist', async () => {
            mockPrisma.systemConfig.findUnique.mockResolvedValue(null);
            mockPrisma.user.count.mockResolvedValue(1); // Users exist!

            await expect(
                service.executeBootstrap(validDto, '192.168.1.1', 'Mozilla/5.0'),
            ).rejects.toThrow(ConflictException);

            expect(mockPrisma.user.create).not.toHaveBeenCalled();
        });
    });
});
