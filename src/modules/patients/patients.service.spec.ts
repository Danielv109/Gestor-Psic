// src/modules/patients/patients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '@prisma/client';
import {
    mockTerapeuta,
    mockPatient,
    mockPatientsRepository,
    mockAuditService,
} from '../../test/test-utils';

describe('PatientsService', () => {
    let service: PatientsService;
    let patientsRepo: ReturnType<typeof mockPatientsRepository>;
    let auditService: ReturnType<typeof mockAuditService>;

    beforeEach(async () => {
        patientsRepo = mockPatientsRepository();
        auditService = mockAuditService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PatientsService,
                { provide: PatientsRepository, useValue: patientsRepo },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<PatientsService>(PatientsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create patient with generated external ID', async () => {
            const actor = mockTerapeuta();
            const dto = {
                firstName: 'Juan',
                lastName: 'Pérez',
                dateOfBirth: '1990-05-15',
                email: 'juan@example.com',
            };

            const result = await service.create(dto, actor);

            expect(patientsRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    externalId: expect.stringMatching(/^PAT-\d{8}-[A-Z0-9]{4}$/),
                })
            );
            expect(result).toBeDefined();
        });

        it('should log CREATE audit event', async () => {
            const actor = mockTerapeuta();
            const dto = {
                firstName: 'Juan',
                lastName: 'Pérez',
                dateOfBirth: '1990-05-15',
            };

            await service.create(dto, actor);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: actor.id,
                    action: AuditAction.CREATE,
                    resource: AuditResource.PATIENT,
                    success: true,
                })
            );
        });
    });

    describe('findById', () => {
        it('should return patient and log READ event', async () => {
            const actor = mockTerapeuta();
            const patient = mockPatient();
            patientsRepo.findById.mockResolvedValue(patient);

            const result = await service.findById('patient-uuid-001', actor);

            expect(result).toEqual(patient);
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: AuditAction.READ,
                    resource: AuditResource.PATIENT,
                })
            );
        });

        it('should throw NotFoundException when patient does not exist', async () => {
            const actor = mockTerapeuta();
            patientsRepo.findById.mockResolvedValue(null);

            await expect(
                service.findById('non-existent', actor)
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update patient and log audit event with updated fields', async () => {
            const actor = mockTerapeuta();
            const patient = mockPatient();
            patientsRepo.findById.mockResolvedValue(patient);

            const dto = {
                email: 'nuevo@email.com',
                phone: '+52 555 999 8888',
            };

            await service.update('patient-uuid-001', dto, actor);

            expect(patientsRepo.update).toHaveBeenCalledWith('patient-uuid-001', dto);
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: AuditAction.UPDATE,
                    details: { updatedFields: ['email', 'phone'] },
                })
            );
        });

        it('should throw NotFoundException when patient does not exist', async () => {
            const actor = mockTerapeuta();
            patientsRepo.findById.mockResolvedValue(null);

            await expect(
                service.update('non-existent', { email: 'test@test.com' }, actor)
            ).rejects.toThrow(NotFoundException);
        });
    });

    // =========================================================
    // CRITICAL TEST: Soft delete sets deletedAt, not hard delete
    // =========================================================
    describe('softDelete', () => {
        it('should soft delete patient (set deletedAt, not hard delete)', async () => {
            const actor = mockTerapeuta();
            const patient = mockPatient();
            patientsRepo.findById.mockResolvedValue(patient);

            await service.softDelete('patient-uuid-001', actor);

            expect(patientsRepo.softDelete).toHaveBeenCalledWith('patient-uuid-001');
            // The mock repository doesn't have a 'delete' method - only softDelete
            // This verifies we're using soft delete, not hard delete
        });

        it('should log DELETE audit event with softDelete flag', async () => {
            const actor = mockTerapeuta();
            const patient = mockPatient();
            patientsRepo.findById.mockResolvedValue(patient);

            await service.softDelete('patient-uuid-001', actor);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: AuditAction.DELETE,
                    resource: AuditResource.PATIENT,
                    success: true,
                    details: { softDelete: true },
                })
            );
        });

        it('should throw NotFoundException when patient does not exist', async () => {
            const actor = mockTerapeuta();
            patientsRepo.findById.mockResolvedValue(null);

            await expect(
                service.softDelete('non-existent', actor)
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByTherapist', () => {
        it('should return patients for therapist and log audit', async () => {
            const actor = mockTerapeuta();
            const patients = [mockPatient(), mockPatient({ id: 'patient-2' })];
            patientsRepo.findByTherapist.mockResolvedValue(patients);

            const result = await service.findByTherapist(actor.id, actor);

            expect(result).toHaveLength(2);
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: AuditAction.READ,
                    details: { count: 2, type: 'list' },
                })
            );
        });
    });

    describe('findWithTeam', () => {
        it('should return patient with clinical team', async () => {
            const actor = mockTerapeuta();
            const patientWithTeam = {
                ...mockPatient(),
                clinicalTeam: [
                    { userId: 'therapist-1', contextualRole: 'TERAPEUTA_TITULAR' },
                ],
            };
            patientsRepo.findWithCollaborations.mockResolvedValue(patientWithTeam);

            const result = await service.findWithTeam('patient-uuid-001', actor);

            expect(result.clinicalTeam).toBeDefined();
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: { includeTeam: true },
                })
            );
        });
    });

    describe('generateExternalId', () => {
        it('should generate ID in format PAT-YYYYMMDD-XXXX', () => {
            // Access private method for testing
            const externalId = (service as any).generateExternalId();

            expect(externalId).toMatch(/^PAT-\d{8}-[A-Z0-9]{4}$/);
        });

        it('should generate unique IDs on each call', () => {
            const id1 = (service as any).generateExternalId();
            const id2 = (service as any).generateExternalId();

            // Random suffix should be different (extremely high probability)
            expect(id1).not.toBe(id2);
        });
    });
});
