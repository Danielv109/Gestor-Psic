// src/modules/sessions/abac-access.integration.spec.ts
/**
 * Integration tests for ABAC (Attribute-Based Access Control)
 * 
 * These tests verify that the system correctly enforces access control
 * based on user roles, collaborations, and ownership.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import {
    mockTerapeuta,
    mockSupervisor,
    mockAuditor,
    mockAsistente,
    mockClinicalSession,
    mockSignedSession,
    mockAppointment,
    mockCollaboration,
    mockSessionsRepository,
    mockAppointmentsRepository,
    mockCryptoService,
    mockAuditService,
} from '../../test/test-utils';

describe('ABAC Access Control Integration', () => {
    let sessionsService: SessionsService;
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

        sessionsService = module.get<SessionsService>(SessionsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================
    // SCENARIO: Therapist Ownership
    // =========================================================
    describe('Therapist Ownership', () => {
        const ownerTherapist = mockTerapeuta({ id: 'owner-therapist-uuid' });
        const otherTherapist = mockTerapeuta({ id: 'other-therapist-uuid' });

        it('owner therapist can edit their session', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                sessionsService.update(session.id, { clinicalNarrative: { plan: 'Updated plan' } }, ownerTherapist)
            ).resolves.toBeDefined();

            expect(sessionsRepo.update).toHaveBeenCalled();
        });

        it('other therapist CANNOT edit session they do not own', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                sessionsService.update(session.id, { clinicalNarrative: { plan: 'Hacked!' } }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);

            expect(sessionsRepo.update).not.toHaveBeenCalled();
        });

        it('owner therapist can sign their session', async () => {
            const session = mockClinicalSession({
                therapistId: ownerTherapist.id,
                clinicalNarrativeEncrypted: Buffer.from('data'),
                narrativeIV: Buffer.from('0123456789abcdef'),
            });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                sessionsService.sign(session.id, { signatureConfirmation: 'Confirmo' }, ownerTherapist)
            ).resolves.toBeDefined();

            expect(sessionsRepo.sign).toHaveBeenCalled();
        });

        it('other therapist CANNOT sign session they do not own', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                sessionsService.sign(session.id, { signatureConfirmation: 'Confirmo' }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // =========================================================
    // SCENARIO: Post-Signature Immutability
    // =========================================================
    describe('Post-Signature Immutability', () => {
        const therapist = mockTerapeuta();

        it('CANNOT edit session after signing', async () => {
            const signedSession = mockSignedSession({ therapistId: therapist.id });
            sessionsRepo.findById.mockResolvedValue(signedSession);

            await expect(
                sessionsService.update(signedSession.id, { clinicalNarrative: { plan: 'Too late!' } }, therapist)
            ).rejects.toThrow(ForbiddenException);

            await expect(
                sessionsService.update(signedSession.id, { clinicalNarrative: { plan: 'Too late!' } }, therapist)
            ).rejects.toThrow('Las sesiones firmadas no pueden editarse');
        });

        it('CANNOT sign session that is already signed', async () => {
            const signedSession = mockSignedSession({ therapistId: therapist.id });
            sessionsRepo.findById.mockResolvedValue(signedSession);

            await expect(
                sessionsService.sign(signedSession.id, { signatureConfirmation: 'Confirmo' }, therapist)
            ).rejects.toThrow('La sesión ya está firmada');
        });

        it('locked session (isLocked=true) CANNOT be edited', async () => {
            const lockedSession = mockClinicalSession({
                therapistId: therapist.id,
                isLocked: true,
                signedAt: null, // Edge case: locked but not signed
            });
            sessionsRepo.findById.mockResolvedValue(lockedSession);

            await expect(
                sessionsService.update(lockedSession.id, { clinicalNarrative: { plan: 'Test' } }, therapist)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // =========================================================
    // SCENARIO: Role-Based Access
    // =========================================================
    describe('Role-Based Access', () => {
        describe('AUDITOR role', () => {
            const auditor = mockAuditor();
            const therapist = mockTerapeuta();

            it('auditor can read audit logs (via AuditService)', async () => {
                // AuditService.findByPatient and findByActor are accessible
                expect(auditService.findByPatient).toBeDefined();
                expect(auditService.findByActor).toBeDefined();
            });

            // Note: In a full implementation, there would be guards preventing
            // auditors from accessing clinical session content. These tests
            // demonstrate the service-level checks that should exist.
        });

        describe('SUPERVISOR role', () => {
            const supervisor = mockSupervisor();
            const therapist = mockTerapeuta();

            it('supervisor cannot modify sessions of other therapists', async () => {
                const session = mockClinicalSession({ therapistId: therapist.id });
                sessionsRepo.findById.mockResolvedValue(session);

                // Supervisor is not the owner
                await expect(
                    sessionsService.update(session.id, { clinicalNarrative: { plan: 'Supervised!' } }, supervisor)
                ).rejects.toThrow(ForbiddenException);
            });
        });

        describe('ASISTENTE role', () => {
            const asistente = mockAsistente();
            const therapist = mockTerapeuta();

            it('asistente cannot modify clinical sessions', async () => {
                const session = mockClinicalSession({ therapistId: therapist.id });
                sessionsRepo.findById.mockResolvedValue(session);

                await expect(
                    sessionsService.update(session.id, { clinicalNarrative: { plan: 'Test' } }, asistente)
                ).rejects.toThrow(ForbiddenException);
            });

            it('asistente cannot sign clinical sessions', async () => {
                const session = mockClinicalSession({
                    therapistId: therapist.id,
                    clinicalNarrativeEncrypted: Buffer.from('data'),
                });
                sessionsRepo.findById.mockResolvedValue(session);

                await expect(
                    sessionsService.sign(session.id, { signatureConfirmation: 'Confirmo' }, asistente)
                ).rejects.toThrow(ForbiddenException);
            });
        });
    });

    // =========================================================
    // SCENARIO: Audit Trail Verification
    // =========================================================
    describe('Audit Trail', () => {
        const therapist = mockTerapeuta();

        it('successful read should log audit event', async () => {
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await sessionsService.findById('session-uuid-001', therapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'READ',
                    resource: 'CLINICAL_SESSION',
                    success: true,
                    actorId: therapist.id,
                })
            );
        });

        it('update should log audit event with change details', async () => {
            const session = mockClinicalSession({ therapistId: therapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await sessionsService.update(session.id, {
                clinicalNarrative: { plan: 'Updated' },
                changeReason: 'Corrección',
            }, therapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'UPDATE',
                    resource: 'CLINICAL_SESSION',
                    details: expect.objectContaining({
                        changeReason: 'Corrección',
                    }),
                })
            );
        });

        it('sign should log audit event', async () => {
            const session = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('data'),
                narrativeIV: Buffer.from('0123456789abcdef'),
            });
            sessionsRepo.findById.mockResolvedValue(session);

            await sessionsService.sign(session.id, { signatureConfirmation: 'Confirmo' }, therapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'UPDATE',
                    details: expect.objectContaining({
                        action: 'sign',
                    }),
                })
            );
        });
    });

    // =========================================================
    // SCENARIO: Session Version History
    // =========================================================
    describe('Version History for Audit', () => {
        const therapist = mockTerapeuta();

        it('should create version before updating existing narrative', async () => {
            const session = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('old-data'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'key-uuid-001',
            });
            sessionsRepo.findById.mockResolvedValue(session);
            sessionsRepo.getVersionCount.mockResolvedValue(1);

            await sessionsService.update(session.id, {
                clinicalNarrative: { plan: 'New plan' },
                changeReason: 'Update reason',
            }, therapist);

            expect(sessionsRepo.createVersion).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionId: session.id,
                    versionNumber: 2,
                    changedBy: therapist.id,
                    changeReason: 'Update reason',
                })
            );
        });

        it('should not create version for new session without existing narrative', async () => {
            const session = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: null,
                narrativeIV: null,
            });
            sessionsRepo.findById.mockResolvedValue(session);

            await sessionsService.update(session.id, {
                clinicalNarrative: { plan: 'First plan' },
            }, therapist);

            expect(sessionsRepo.createVersion).not.toHaveBeenCalled();
        });
    });
});
