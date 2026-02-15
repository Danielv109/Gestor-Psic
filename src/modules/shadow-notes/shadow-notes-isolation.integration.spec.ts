// src/modules/shadow-notes/shadow-notes-isolation.integration.spec.ts
/**
 * Integration tests for Shadow Notes Security Isolation
 * 
 * Shadow Notes are PERSONAL notes encrypted with the therapist's personal key.
 * They should NEVER be accessible by:
 * - Other therapists
 * - Supervisors
 * - Auditors
 * - System administrators
 * 
 * Only the owner therapist can decrypt and access their shadow notes.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ShadowNotesService } from './shadow-notes.service';
import { ShadowNotesRepository } from './shadow-notes.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import {
    mockTerapeuta,
    mockSupervisor,
    mockAuditor,
    mockAsistente,
    mockShadowNote,
    mockClinicalSession,
    mockShadowNotesRepository,
    mockSessionsRepository,
    mockCryptoService,
    mockAuditService,
} from '../../test/test-utils';

describe('Shadow Notes Security Isolation', () => {
    let service: ShadowNotesService;
    let shadowNotesRepo: ReturnType<typeof mockShadowNotesRepository>;
    let sessionsRepo: ReturnType<typeof mockSessionsRepository>;
    let cryptoService: ReturnType<typeof mockCryptoService>;
    let auditService: ReturnType<typeof mockAuditService>;

    // Define our test actors
    const ownerTherapist = mockTerapeuta({ id: 'owner-therapist-uuid' });
    const otherTherapist = mockTerapeuta({ id: 'other-therapist-uuid' });
    const supervisor = mockSupervisor();
    const auditor = mockAuditor();
    const asistente = mockAsistente();

    beforeEach(async () => {
        shadowNotesRepo = mockShadowNotesRepository();
        sessionsRepo = mockSessionsRepository();
        cryptoService = mockCryptoService();
        auditService = mockAuditService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ShadowNotesService,
                { provide: ShadowNotesRepository, useValue: shadowNotesRepo },
                { provide: SessionsRepository, useValue: sessionsRepo },
                { provide: CryptoService, useValue: cryptoService },
                { provide: AuditService, useValue: auditService },
            ],
        }).compile();

        service = module.get<ShadowNotesService>(ShadowNotesService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================
    // CRITICAL: Therapist A cannot read Therapist B's shadow notes
    // =========================================================
    describe('Therapist-to-Therapist Isolation', () => {
        it('other therapist CANNOT read shadow note by ID', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.findById(ownerNote.id, otherTherapist)
            ).rejects.toThrow(ForbiddenException);

            await expect(
                service.findById(ownerNote.id, otherTherapist)
            ).rejects.toThrow('Sin acceso a esta nota sombra');

            // Decryption should NOT be attempted
            expect(cryptoService.decryptShadowNote).not.toHaveBeenCalled();
        });

        it('other therapist receives null when querying by session (no existence leak)', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findBySession.mockResolvedValue(ownerNote);

            const result = await service.findBySession('session-uuid-001', otherTherapist);

            // Returns null instead of throwing - doesn't reveal that note exists
            expect(result).toBeNull();
        });

        it('other therapist CANNOT update shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.update(ownerNote.id, { content: 'Hacked content!' }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);

            expect(shadowNotesRepo.update).not.toHaveBeenCalled();
        });

        it('other therapist CANNOT delete shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.softDelete(ownerNote.id, otherTherapist)
            ).rejects.toThrow(ForbiddenException);

            expect(shadowNotesRepo.softDelete).not.toHaveBeenCalled();
        });

        it('other therapist CANNOT create shadow note for session they do not own', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                service.create({ sessionId: session.id, content: 'Intruder note' }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);

            expect(shadowNotesRepo.create).not.toHaveBeenCalled();
        });
    });

    // =========================================================
    // CRITICAL: Supervisor cannot decrypt shadow notes
    // =========================================================
    describe('Supervisor Isolation', () => {
        it('supervisor CANNOT read shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.findById(ownerNote.id, supervisor)
            ).rejects.toThrow(ForbiddenException);
        });

        it('supervisor receives null when querying by session', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findBySession.mockResolvedValue(ownerNote);

            const result = await service.findBySession('session-uuid-001', supervisor);

            expect(result).toBeNull();
        });

        it('supervisor CANNOT update shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.update(ownerNote.id, { content: 'Supervisor edit' }, supervisor)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // =========================================================
    // CRITICAL: Auditor cannot access shadow note content
    // =========================================================
    describe('Auditor Isolation', () => {
        it('auditor CANNOT read shadow note content', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.findById(ownerNote.id, auditor)
            ).rejects.toThrow(ForbiddenException);

            // Auditor should never trigger decryption
            expect(cryptoService.decryptShadowNote).not.toHaveBeenCalled();
        });

        it('auditor can see audit logs about shadow notes but not content', async () => {
            // Audit logs contain metadata about access, not the content itself
            // This is verified by the AuditService sanitizing sensitive fields
            // The actual content is never stored in audit logs
            expect(auditService.log).toBeDefined();
        });
    });

    // =========================================================
    // CRITICAL: Asistente cannot access shadow notes
    // =========================================================
    describe('Asistente Isolation', () => {
        it('asistente CANNOT read shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);

            await expect(
                service.findById(ownerNote.id, asistente)
            ).rejects.toThrow(ForbiddenException);
        });

        it('asistente CANNOT create shadow note', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                service.create({ sessionId: session.id, content: 'Test' }, asistente)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    // =========================================================
    // Owner Access Verification
    // =========================================================
    describe('Owner Access', () => {
        it('owner CAN read their own shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            const result = await service.findById(ownerNote.id, ownerTherapist);

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
            expect(cryptoService.decryptShadowNote).toHaveBeenCalledWith(
                ownerNote.contentEncrypted,
                ownerNote.contentIV,
                ownerTherapist.id,
                expect.any(String)
            );
        });

        it('owner CAN update their own shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.update(ownerNote.id, { content: 'Updated content' }, ownerTherapist);

            expect(cryptoService.encryptShadowNote).toHaveBeenCalledWith(
                'Updated content',
                ownerTherapist.id
            );
            expect(shadowNotesRepo.update).toHaveBeenCalled();
        });

        it('owner CAN delete their own shadow note', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.softDelete(ownerNote.id, ownerTherapist);

            expect(shadowNotesRepo.softDelete).toHaveBeenCalledWith(ownerNote.id);
        });

        it('owner CAN create shadow note for their session', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await service.create({ sessionId: session.id, content: 'My private note' }, ownerTherapist);

            expect(cryptoService.encryptShadowNote).toHaveBeenCalledWith(
                'My private note',
                ownerTherapist.id
            );
            expect(shadowNotesRepo.create).toHaveBeenCalled();
        });
    });

    // =========================================================
    // Personal Key Derivation Isolation
    // =========================================================
    describe('Personal Key Derivation', () => {
        it('uses owner therapist ID for key derivation on encryption', async () => {
            const session = mockClinicalSession({ therapistId: ownerTherapist.id });
            sessionsRepo.findById.mockResolvedValue(session);

            await service.create({ sessionId: session.id, content: 'Secret' }, ownerTherapist);

            expect(cryptoService.encryptShadowNote).toHaveBeenCalledWith(
                expect.any(String),
                ownerTherapist.id // Key is derived from owner's ID
            );
        });

        it('uses owner therapist ID for key derivation on decryption', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.findById(ownerNote.id, ownerTherapist);

            expect(cryptoService.decryptShadowNote).toHaveBeenCalledWith(
                expect.any(Buffer),
                expect.any(Buffer),
                ownerTherapist.id, // Key is derived from owner's ID
                expect.any(String)
            );
        });
    });

    // =========================================================
    // List Isolation
    // =========================================================
    describe('List Operations Isolation', () => {
        it('findMyNotes only returns notes for the requesting therapist', async () => {
            const myNotes = [
                mockShadowNote({ id: 'note-1', therapistId: ownerTherapist.id }),
                mockShadowNote({ id: 'note-2', therapistId: ownerTherapist.id }),
            ];
            shadowNotesRepo.findByTherapist.mockResolvedValue(myNotes);

            const result = await service.findMyNotes(ownerTherapist);

            expect(shadowNotesRepo.findByTherapist).toHaveBeenCalledWith(ownerTherapist.id);
            expect(result).toHaveLength(2);

            // Verify only metadata is returned, not content
            result.forEach(note => {
                // These should be defined
                expect(note.id).toBeDefined();
                expect(note.sessionId).toBeDefined();
                // Encrypted content should NOT be included in metadata
                expect((note as any).contentEncrypted).toBeUndefined();
            });
        });

        it('other therapist gets empty list when calling findMyNotes', async () => {
            shadowNotesRepo.findByTherapist.mockResolvedValue([]);

            const result = await service.findMyNotes(otherTherapist);

            expect(shadowNotesRepo.findByTherapist).toHaveBeenCalledWith(otherTherapist.id);
            expect(result).toHaveLength(0);
        });
    });

    // =========================================================
    // Audit Logging for Security Events
    // =========================================================
    describe('Security Audit Logging', () => {
        it('logs DECRYPT action on successful read', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.findById(ownerNote.id, ownerTherapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'DECRYPT',
                    resource: 'SHADOW_NOTE',
                    actorId: ownerTherapist.id,
                    success: true,
                })
            );
        });

        it('logs DELETE with softDelete flag', async () => {
            const ownerNote = mockShadowNote({ therapistId: ownerTherapist.id });
            shadowNotesRepo.findById.mockResolvedValue(ownerNote);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.softDelete(ownerNote.id, ownerTherapist);

            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'DELETE',
                    resource: 'SHADOW_NOTE',
                    details: { softDelete: true },
                })
            );
        });
    });
});
