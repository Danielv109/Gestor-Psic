// src/modules/sessions/clinical-scenarios.integration.spec.ts
/**
 * Clinical Scenario Integration Tests
 * 
 * These tests simulate real-world clinical workflows to ensure
 * the system behaves correctly in production scenarios.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsRepository } from './sessions.repository';
import { AppointmentsRepository } from '../appointments/appointments.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import { ShadowNotesService } from '../shadow-notes/shadow-notes.service';
import { ShadowNotesRepository } from '../shadow-notes/shadow-notes.repository';
import {
    mockTerapeuta,
    mockSupervisor,
    mockClinicalSession,
    mockSignedSession,
    mockAppointment,
    mockShadowNote,
    mockClinicalNarrative,
    mockSessionsRepository,
    mockAppointmentsRepository,
    mockShadowNotesRepository,
    mockCryptoService,
    mockAuditService,
} from '../../test/test-utils';

describe('Clinical Scenario Integration Tests', () => {
    let sessionsService: SessionsService;
    let shadowNotesService: ShadowNotesService;
    let sessionsRepo: ReturnType<typeof mockSessionsRepository>;
    let appointmentsRepo: ReturnType<typeof mockAppointmentsRepository>;
    let shadowNotesRepo: ReturnType<typeof mockShadowNotesRepository>;
    let cryptoService: ReturnType<typeof mockCryptoService>;
    let auditService: ReturnType<typeof mockAuditService>;

    const therapist = mockTerapeuta();

    beforeEach(async () => {
        sessionsRepo = mockSessionsRepository();
        appointmentsRepo = mockAppointmentsRepository();
        shadowNotesRepo = mockShadowNotesRepository();
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

        // Create ShadowNotesService separately
        const shadowModule: TestingModule = await Test.createTestingModule({
            providers: [
                ShadowNotesService,
                { provide: ShadowNotesRepository, useValue: shadowNotesRepo },
                { provide: SessionsRepository, useValue: sessionsRepo },
                { provide: CryptoService, useValue: cryptoService },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        shadowNotesService = shadowModule.get<ShadowNotesService>(ShadowNotesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================
    // SCENARIO 1: Complete Session Flow
    // Create appointment → Start session → Write narrative → Sign → Verify locked
    // =========================================================
    describe('Scenario 1: Complete Session Flow', () => {
        it('should complete full clinical session lifecycle', async () => {
            // Step 1: Appointment exists
            const appointment = mockAppointment({ therapistId: therapist.id });
            appointmentsRepo.findById.mockResolvedValue(appointment);

            // Step 2: Create session (starts the clinical encounter)
            const dto = {
                appointmentId: appointment.id,
                startedAt: new Date().toISOString(),
                clinicalNarrative: mockClinicalNarrative(),
            };

            const createdSession = await sessionsService.create(dto, therapist);

            expect(createdSession).toBeDefined();
            expect(cryptoService.encryptClinicalNarrative).toHaveBeenCalled();
            expect(appointmentsRepo.update).toHaveBeenCalledWith(
                appointment.id,
                { status: 'IN_PROGRESS' }
            );

            // Step 3: Update session with more notes
            const sessionForUpdate = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('initial'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'key-uuid-001',
            });
            sessionsRepo.findById.mockResolvedValue(sessionForUpdate);

            await sessionsService.update(sessionForUpdate.id, {
                clinicalNarrative: mockClinicalNarrative(),
                changeReason: 'Added additional observations',
            }, therapist);

            // Verify version was created
            expect(sessionsRepo.createVersion).toHaveBeenCalledWith(
                expect.objectContaining({
                    changedBy: therapist.id,
                    changeReason: 'Added additional observations',
                })
            );

            // Step 4: Sign the session (locks it permanently)
            const sessionForSign = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('final'),
                narrativeIV: Buffer.from('0123456789abcdef'),
            });
            sessionsRepo.findById.mockResolvedValue(sessionForSign);

            const signedResult = await sessionsService.sign(sessionForSign.id, { signatureConfirmation: 'Confirmo' }, therapist);

            expect(sessionsRepo.sign).toHaveBeenCalled();
            expect(cryptoService.generateSessionSignature).toHaveBeenCalled();
            expect(appointmentsRepo.update).toHaveBeenCalledWith(
                sessionForSign.appointmentId,
                { status: 'COMPLETED' }
            );

            // Step 5: Attempt to edit after signing - SHOULD FAIL
            sessionsRepo.findById.mockResolvedValue(mockSignedSession({ therapistId: therapist.id }));

            await expect(
                sessionsService.update(sessionForSign.id, {
                    clinicalNarrative: { plan: 'Cannot edit!' },
                }, therapist)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // =========================================================
    // SCENARIO 2: Post-Signature Immutability Attack
    // Attempt various modifications after signature
    // =========================================================
    describe('Scenario 2: Post-Signature Immutability Attack', () => {
        const signedSession = mockSignedSession({ therapistId: therapist.id });

        beforeEach(() => {
            sessionsRepo.findById.mockResolvedValue(signedSession);
        });

        it('CANNOT modify clinical narrative after signature', async () => {
            await expect(
                sessionsService.update(signedSession.id, {
                    clinicalNarrative: { subjectiveReport: 'Altered history!' },
                }, therapist)
            ).rejects.toThrow(ForbiddenException);
        });

        it('CANNOT modify session timing after signature', async () => {
            await expect(
                sessionsService.update(signedSession.id, {
                    endedAt: new Date().toISOString(),
                }, therapist)
            ).rejects.toThrow(ForbiddenException);
        });

        it('CANNOT re-sign already signed session', async () => {
            await expect(
                sessionsService.sign(signedSession.id, { signatureConfirmation: 'Confirmo' }, therapist)
            ).rejects.toThrow(ConflictException);
        });

        it('audit trail captures all access attempts', async () => {
            // Read the signed session
            await sessionsService.findById(signedSession.id, therapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'READ',
                    resourceId: signedSession.id,
                })
            );
        });
    });

    // =========================================================
    // SCENARIO 3: Shadow Note Privacy
    // Therapist creates personal notes that are completely private
    // =========================================================
    describe('Scenario 3: Shadow Note Privacy', () => {
        const otherTherapist = mockTerapeuta({ id: 'other-therapist' });

        it('therapist can create private shadow note', async () => {
            const session = mockClinicalSession({ therapistId: therapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await shadowNotesService.create({
                sessionId: session.id,
                content: 'Mi nota privada con impresiones personales',
            }, therapist);

            expect(cryptoService.encryptShadowNote).toHaveBeenCalledWith(
                expect.any(String),
                therapist.id
            );
        });

        it('other therapist cannot see if shadow note exists', async () => {
            const ownerNote = mockShadowNote({ therapistId: therapist.id });
            shadowNotesRepo.findBySession.mockResolvedValue(ownerNote);

            const result = await shadowNotesService.findBySession('session-uuid-001', otherTherapist);

            // Returns null - doesn't reveal existence
            expect(result).toBeNull();
        });

        it('supervisor cannot access shadow notes', async () => {
            const supervisor = mockSupervisor();
            const ownerNote = mockShadowNote({ therapistId: therapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                shadowNotesService.findById(ownerNote.id, supervisor)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // =========================================================
    // SCENARIO 4: Key Rotation Workflow
    // Rotate encryption key and verify re-encryption works
    // =========================================================
    describe('Scenario 4: Key Rotation Workflow', () => {
        it('should re-encrypt session with new key after rotation', async () => {
            const session = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('old-encrypted'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'old-key-uuid',
            });
            sessionsRepo.findById.mockResolvedValue(session);

            // Simulate key rotation result
            cryptoService.reEncryptClinicalNarrative.mockResolvedValue({
                encrypted: Buffer.from('new-encrypted'),
                iv: Buffer.from('abcdef0123456789'),
                keyId: 'new-key-uuid',
            });

            const result = await sessionsService.reEncryptSession(session.id, therapist);

            expect(result.success).toBe(true);
            expect(result.newKeyId).toBe('new-key-uuid');
            expect(sessionsRepo.update).toHaveBeenCalledWith(
                session.id,
                expect.objectContaining({
                    narrativeKeyId: 'new-key-uuid',
                })
            );
        });

        it('should log key rotation in audit trail', async () => {
            const session = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('data'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'old-key-uuid',
            });
            sessionsRepo.findById.mockResolvedValue(session);

            await sessionsService.reEncryptSession(session.id, therapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'UPDATE',
                    details: expect.objectContaining({
                        action: 'reEncrypt',
                        oldKeyId: 'old-key-uuid',
                        newKeyId: expect.any(String),
                    }),
                })
            );
        });
    });

    // =========================================================
    // SCENARIO 5: Soft Delete and Data Retention
    // Verify soft delete behavior for compliance
    // =========================================================
    describe('Scenario 5: Soft Delete and Data Retention', () => {
        it('soft deleted shadow note is not returned', async () => {
            const deletedNote = mockShadowNote({
                therapistId: therapist.id,
                deletedAt: new Date(),
            });

            // Repository should filter out deleted notes
            shadowNotesRepo.findById.mockResolvedValue(null);

            await expect(
                shadowNotesService.findById(deletedNote.id, therapist)
            ).rejects.toThrow('Nota sombra no encontrada');
        });

        it('soft delete logs audit event', async () => {
            const note = mockShadowNote({ therapistId: therapist.id });
            shadowNotesRepo.findById.mockResolvedValue(note);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await shadowNotesService.softDelete(note.id, therapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'DELETE',
                    details: { softDelete: true },
                })
            );
        });
    });

    // =========================================================
    // SCENARIO 6: Version History for Compliance
    // Verify all changes are tracked
    // =========================================================
    describe('Scenario 6: Version History for Compliance', () => {
        it('should track all narrative versions before signing', async () => {
            const session = mockClinicalSession({
                therapistId: therapist.id,
                clinicalNarrativeEncrypted: Buffer.from('v1'),
                narrativeIV: Buffer.from('0123456789abcdef'),
                narrativeKeyId: 'key-uuid-001',
            });
            sessionsRepo.findById.mockResolvedValue(session);
            sessionsRepo.getVersionCount.mockResolvedValue(0);

            // First update
            await sessionsService.update(session.id, {
                clinicalNarrative: mockClinicalNarrative(),
                changeReason: 'Primera corrección',
            }, therapist);

            sessionsRepo.getVersionCount.mockResolvedValue(1);

            // Second update
            await sessionsService.update(session.id, {
                clinicalNarrative: mockClinicalNarrative(),
                changeReason: 'Segunda corrección',
            }, therapist);

            expect(sessionsRepo.createVersion).toHaveBeenCalledTimes(2);
        });

        it('should retrieve version history for audit', async () => {
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());
            sessionsRepo.getVersions.mockResolvedValue([
                { id: 'v1', versionNumber: 1, createdAt: new Date(), changeReason: 'Initial' },
                { id: 'v2', versionNumber: 2, createdAt: new Date(), changeReason: 'Update 1' },
                { id: 'v3', versionNumber: 3, createdAt: new Date(), changeReason: 'Update 2' },
            ]);

            const versions = await sessionsService.getVersions('session-uuid-001', therapist);

            expect(versions).toHaveLength(3);
            expect(versions[0].versionNumber).toBe(1);
        });
    });

    // =========================================================
    // SCENARIO 7: Concurrent Access
    // Verify conflict handling
    // =========================================================
    describe('Scenario 7: Concurrent Access Handling', () => {
        it('should prevent duplicate session creation for same appointment', async () => {
            const appointment = mockAppointment();
            appointmentsRepo.findById.mockResolvedValue(appointment);
            sessionsRepo.findByAppointment.mockResolvedValue(mockClinicalSession());

            await expect(
                sessionsService.create({
                    appointmentId: appointment.id,
                    startedAt: new Date().toISOString(),
                }, therapist)
            ).rejects.toThrow(ConflictException);
        });

        it('should prevent duplicate shadow note for same session', async () => {
            const session = mockClinicalSession({ therapistId: therapist.id });
            sessionsRepo.findById.mockResolvedValue(session);
            shadowNotesRepo.existsForSession.mockResolvedValue(true);

            await expect(
                shadowNotesService.create({
                    sessionId: session.id,
                    content: 'Duplicate attempt',
                }, therapist)
            ).rejects.toThrow(ConflictException);
        });
    });
});
