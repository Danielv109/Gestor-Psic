// src/modules/sessions/sessions.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import {
    mockTerapeuta,
    mockSupervisor,
    mockClinicalSession,
    mockSignedSession,
    mockAppointment,
    mockClinicalNarrative,
    mockSessionsRepository,
    mockAppointmentsRepository,
    mockCryptoService,
    mockAuditService,
} from '../../test/test-utils';

describe('SessionsService', () => {
    let service: SessionsService;
    let sessionsRepo: ReturnType<typeof mockSessionsRepository>;
    let appointmentsRepo: ReturnType<typeof mockAppointmentsRepository>;
    let cryptoService: ReturnType<typeof mockCryptoService>;
    let auditService: ReturnType<typeof mockAuditService>;

    beforeEach(async () => {
        sessionsRepo = mockSessionsRepository();
        appointmentsRepo = mockAppointmentsRepository();
        cryptoService = mockCryptoService();
        auditService = mockAuditService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsService,
                { provide: SessionsRepository, useValue: sessionsRepo },
                { provide: AppointmentsRepository, useValue: appointmentsRepo },
                { provide: CryptoService, useValue: cryptoService },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<SessionsService>(SessionsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a session with encrypted narrative', async () => {
            const actor = mockTerapeuta();
            const dto = {
                appointmentId: 'appointment-uuid-001',
                startedAt: new Date().toISOString(),
                clinicalNarrative: mockClinicalNarrative(),
            };

            const result = await service.create(dto, actor);

            expect(appointmentsRepo.findById).toHaveBeenCalledWith(dto.appointmentId);
            expect(cryptoService.encryptClinicalNarrative).toHaveBeenCalledWith(dto.clinicalNarrative);
            expect(sessionsRepo.create).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.clinicalNarrativeEncrypted).toBeUndefined(); // Sanitized
        });

        it('should throw NotFoundException when appointment not found', async () => {
            const actor = mockTerapeuta();
            appointmentsRepo.findById.mockResolvedValue(null);

            await expect(
                service.create({ appointmentId: 'non-existent', startedAt: new Date().toISOString() }, actor)
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ConflictException if session already exists for appointment', async () => {
            const actor = mockTerapeuta();
            sessionsRepo.findByAppointment.mockResolvedValue(mockClinicalSession());

            await expect(
                service.create({ appointmentId: 'appointment-uuid-001', startedAt: new Date().toISOString() }, actor)
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should update session and create version history', async () => {
            const actor = mockTerapeuta();
            const session = mockClinicalSession({
                clinicalNarrativeEncrypted: Buffer.from('old-data'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'key-uuid-001',
            });
            sessionsRepo.findById.mockResolvedValue(session);

            const dto = {
                clinicalNarrative: mockClinicalNarrative(),
                changeReason: 'Corrección de typo',
            };

            await service.update('session-uuid-001', dto, actor);

            expect(sessionsRepo.createVersion).toHaveBeenCalled();
            expect(cryptoService.encryptClinicalNarrative).toHaveBeenCalled();
            expect(sessionsRepo.update).toHaveBeenCalled();
        });

        // =========================================================
        // CRITICAL TEST: Signed sessions cannot be edited
        // =========================================================
        it('should throw ForbiddenException when trying to edit a SIGNED session', async () => {
            const actor = mockTerapeuta();
            const signedSession = mockSignedSession();
            sessionsRepo.findById.mockResolvedValue(signedSession);

            const dto = {
                clinicalNarrative: mockClinicalNarrative(),
            };

            await expect(
                service.update('session-uuid-001', dto, actor)
            ).rejects.toThrow(ForbiddenException);

            await expect(
                service.update('session-uuid-001', dto, actor)
            ).rejects.toThrow('Las sesiones firmadas no pueden editarse');
        });

        it('should throw ForbiddenException when session isLocked is true', async () => {
            const actor = mockTerapeuta();
            const lockedSession = mockClinicalSession({ isLocked: true });
            sessionsRepo.findById.mockResolvedValue(lockedSession);

            await expect(
                service.update('session-uuid-001', { clinicalNarrative: mockClinicalNarrative() }, actor)
            ).rejects.toThrow(ForbiddenException);
        });

        // =========================================================
        // CRITICAL TEST: Only session therapist can edit
        // =========================================================
        it('should throw ForbiddenException when non-owner therapist tries to edit', async () => {
            const otherTherapist = mockTerapeuta({ id: 'other-therapist-uuid' });
            const session = mockClinicalSession({ therapistId: 'terapeuta-uuid-001' });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                service.update('session-uuid-001', { clinicalNarrative: mockClinicalNarrative() }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);

            await expect(
                service.update('session-uuid-001', { clinicalNarrative: mockClinicalNarrative() }, otherTherapist)
            ).rejects.toThrow('Solo el terapeuta de la sesión puede editarla');
        });

        it('should throw NotFoundException when session does not exist', async () => {
            const actor = mockTerapeuta();
            sessionsRepo.findById.mockResolvedValue(null);

            await expect(
                service.update('non-existent', { clinicalNarrative: mockClinicalNarrative() }, actor)
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('sign', () => {
        it('should sign session and lock it permanently', async () => {
            const actor = mockTerapeuta();
            const session = mockClinicalSession({
                clinicalNarrativeEncrypted: Buffer.from('data'),
                narrativeIV: Buffer.from('0123456789abcdef'),
            });
            sessionsRepo.findById.mockResolvedValue(session);

            const result = await service.sign('session-uuid-001', { signatureConfirmation: 'Confirmo la firma' }, actor);

            expect(cryptoService.generateSessionSignature).toHaveBeenCalled();
            expect(sessionsRepo.sign).toHaveBeenCalledWith('session-uuid-001', expect.any(String));
            expect(auditService.log).toHaveBeenCalled();
            expect(result.isLocked).toBe(true);
        });

        it('should throw ConflictException when session is already signed', async () => {
            const actor = mockTerapeuta();
            sessionsRepo.findById.mockResolvedValue(mockSignedSession());

            await expect(
                service.sign('session-uuid-001', { signatureConfirmation: 'Confirmo la firma' }, actor)
            ).rejects.toThrow(ConflictException);
        });

        it('should throw ForbiddenException when non-owner tries to sign', async () => {
            const otherTherapist = mockTerapeuta({ id: 'other-therapist-uuid' });
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await expect(
                service.sign('session-uuid-001', { signatureConfirmation: 'Confirmo la firma' }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when signing session without narrative', async () => {
            const actor = mockTerapeuta();
            const sessionWithoutNarrative = mockClinicalSession({
                isDraft: true,
                clinicalNarrativeEncrypted: null,
            });
            sessionsRepo.findById.mockResolvedValue(sessionWithoutNarrative);

            await expect(
                service.sign('session-uuid-001', { signatureConfirmation: 'Confirmo la firma' }, actor)
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('findById', () => {
        it('should return session with decrypted narrative', async () => {
            const actor = mockTerapeuta();
            const session = mockClinicalSession({
                clinicalNarrativeEncrypted: Buffer.from('encrypted'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'key-uuid-001',
            });
            sessionsRepo.findById.mockResolvedValue(session);

            const result = await service.findById('session-uuid-001', actor);

            expect(cryptoService.decryptClinicalNarrative).toHaveBeenCalled();
            expect(result.clinicalNarrative).toBeDefined();
            expect(result.clinicalNarrativeEncrypted).toBeUndefined(); // Sanitized
        });

        it('should log audit event on read', async () => {
            const actor = mockTerapeuta();
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.findById('session-uuid-001', actor);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'READ',
                    resource: 'CLINICAL_SESSION',
                })
            );
        });
    });

    describe('reEncryptSession', () => {
        it('should re-encrypt session with new key after key rotation', async () => {
            const actor = mockTerapeuta();
            const session = mockClinicalSession({
                clinicalNarrativeEncrypted: Buffer.from('old-encrypted'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'old-key-uuid',
            });
            sessionsRepo.findById.mockResolvedValue(session);

            const result = await service.reEncryptSession('session-uuid-001', actor);

            expect(cryptoService.reEncryptClinicalNarrative).toHaveBeenCalled();
            expect(sessionsRepo.update).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.newKeyId).toBeDefined();
        });

        it('should throw BadRequestException when session has no encrypted narrative', async () => {
            const actor = mockTerapeuta();
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await expect(
                service.reEncryptSession('session-uuid-001', actor)
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('getVersions', () => {
        it('should return version history for audit trail', async () => {
            const actor = mockTerapeuta();
            const versions = [
                { id: 'v1', versionNumber: 1, createdAt: new Date(), changeReason: 'Initial' },
                { id: 'v2', versionNumber: 2, createdAt: new Date(), changeReason: 'Update' },
            ];
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());
            sessionsRepo.getVersions.mockResolvedValue(versions);

            const result = await service.getVersions('session-uuid-001', actor);

            expect(result).toHaveLength(2);
            expect(auditService.log).toHaveBeenCalled();
        });
    });
});
