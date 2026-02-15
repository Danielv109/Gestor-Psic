// src/modules/shadow-notes/shadow-notes.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { ShadowNotesService } from './shadow-notes.service';
import { ShadowNotesRepository } from './shadow-notes.repository';
import { SessionsRepository } from '../sessions/sessions.repository';
import { CryptoService } from '../../crypto/crypto.service';
import { AuditService } from '../audit/audit.service';
import {
    mockTerapeuta,
    mockSupervisor,
    mockAuditor,
    mockShadowNote,
    mockClinicalSession,
    mockShadowNotesRepository,
    mockSessionsRepository,
    mockCryptoService,
    mockAuditService,
} from '../../test/test-utils';

describe('ShadowNotesService', () => {
    let service: ShadowNotesService;
    let shadowNotesRepo: ReturnType<typeof mockShadowNotesRepository>;
    let sessionsRepo: ReturnType<typeof mockSessionsRepository>;
    let cryptoService: ReturnType<typeof mockCryptoService>;
    let auditService: ReturnType<typeof mockAuditService>;

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

    describe('create', () => {
        it('should create shadow note encrypted with personal key', async () => {
            const actor = mockTerapeuta();
            const session = mockClinicalSession({ therapistId: actor.id });
            sessionsRepo.findById.mockResolvedValue(session);

            const dto = {
                sessionId: 'session-uuid-001',
                content: 'Nota personal confidencial del terapeuta',
            };

            const result = await service.create(dto, actor);

            expect(cryptoService.encryptShadowNote).toHaveBeenCalledWith(dto.content, actor.id);
            expect(shadowNotesRepo.create).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalled();
            expect(result.id).toBeDefined();
            // Create returns only metadata, not content (security by design)
        });

        it('should throw ForbiddenException when non-owner therapist tries to create', async () => {
            const otherTherapist = mockTerapeuta({ id: 'other-therapist-uuid' });
            const session = mockClinicalSession({ therapistId: 'terapeuta-uuid-001' });
            sessionsRepo.findById.mockResolvedValue(session);

            await expect(
                service.create({ sessionId: 'session-uuid-001', content: 'test' }, otherTherapist)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw ConflictException when shadow note already exists for session', async () => {
            const actor = mockTerapeuta();
            const session = mockClinicalSession({ therapistId: actor.id });
            sessionsRepo.findById.mockResolvedValue(session);
            shadowNotesRepo.existsForSession.mockResolvedValue(true);

            await expect(
                service.create({ sessionId: 'session-uuid-001', content: 'test' }, actor)
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('findById', () => {
        it('should return shadow note with decrypted content for owner', async () => {
            const actor = mockTerapeuta();
            const note = mockShadowNote({ therapistId: actor.id });
            shadowNotesRepo.findById.mockResolvedValue(note);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            const result = await service.findById('shadow-note-uuid-001', actor);

            expect(cryptoService.decryptShadowNote).toHaveBeenCalledWith(
                note.contentEncrypted,
                note.contentIV,
                actor.id,
                'shadow-note-uuid-001'
            );
            expect(result.content).toBeDefined();
        });

        // =========================================================
        // CRITICAL TEST: Only owner therapist can access shadow notes
        // =========================================================
        it('should throw ForbiddenException when other therapist tries to access', async () => {
            const owner = mockTerapeuta({ id: 'owner-therapist' });
            const intruder = mockTerapeuta({ id: 'intruder-therapist' });
            const note = mockShadowNote({ therapistId: owner.id });
            shadowNotesRepo.findById.mockResolvedValue(note);

            await expect(
                service.findById('shadow-note-uuid-001', intruder)
            ).rejects.toThrow(ForbiddenException);

            await expect(
                service.findById('shadow-note-uuid-001', intruder)
            ).rejects.toThrow('Sin acceso a esta nota sombra');
        });

        // =========================================================
        // CRITICAL TEST: Supervisor cannot access shadow notes
        // =========================================================
        it('should throw ForbiddenException when SUPERVISOR tries to access', async () => {
            const owner = mockTerapeuta({ id: 'owner-therapist' });
            const supervisor = mockSupervisor();
            const note = mockShadowNote({ therapistId: owner.id });
            shadowNotesRepo.findById.mockResolvedValue(note);

            await expect(
                service.findById('shadow-note-uuid-001', supervisor)
            ).rejects.toThrow(ForbiddenException);
        });

        // =========================================================
        // CRITICAL TEST: Auditor cannot access shadow note content
        // =========================================================
        it('should throw ForbiddenException when AUDITOR tries to access', async () => {
            const owner = mockTerapeuta({ id: 'owner-therapist' });
            const auditor = mockAuditor();
            const note = mockShadowNote({ therapistId: owner.id });
            shadowNotesRepo.findById.mockResolvedValue(note);

            await expect(
                service.findById('shadow-note-uuid-001', auditor)
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when shadow note does not exist', async () => {
            const actor = mockTerapeuta();
            shadowNotesRepo.findById.mockResolvedValue(null);

            await expect(
                service.findById('non-existent', actor)
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('findBySession', () => {
        it('should return decrypted note for owner', async () => {
            const actor = mockTerapeuta();
            const note = mockShadowNote({ therapistId: actor.id });
            shadowNotesRepo.findBySession.mockResolvedValue(note);
            shadowNotesRepo.findById.mockResolvedValue(note);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            const result = await service.findBySession('session-uuid-001', actor);

            expect(result).toBeDefined();
            expect(result?.content).toBeDefined();
        });

        // =========================================================
        // CRITICAL TEST: Non-owner gets null (not revealing existence)
        // =========================================================
        it('should return null for non-owner (not revealing existence)', async () => {
            const owner = mockTerapeuta({ id: 'owner-therapist' });
            const otherTherapist = mockTerapeuta({ id: 'other-therapist' });
            const note = mockShadowNote({ therapistId: owner.id });
            shadowNotesRepo.findBySession.mockResolvedValue(note);

            const result = await service.findBySession('session-uuid-001', otherTherapist);

            // Should return null, not throw error (doesn't reveal that note exists)
            expect(result).toBeNull();
        });

        it('should return null when no shadow note exists', async () => {
            const actor = mockTerapeuta();
            shadowNotesRepo.findBySession.mockResolvedValue(null);

            const result = await service.findBySession('session-uuid-001', actor);

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update shadow note with re-encrypted content', async () => {
            const actor = mockTerapeuta();
            const note = mockShadowNote({ therapistId: actor.id });
            shadowNotesRepo.findById.mockResolvedValue(note);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            const dto = { content: 'Updated shadow note content' };

            const result = await service.update('shadow-note-uuid-001', dto, actor);

            expect(cryptoService.encryptShadowNote).toHaveBeenCalledWith(dto.content, actor.id);
            expect(shadowNotesRepo.update).toHaveBeenCalled();
            expect(auditService.log).toHaveBeenCalled();
        });

        it('should throw ForbiddenException when non-owner tries to update', async () => {
            const owner = mockTerapeuta({ id: 'owner-therapist' });
            const intruder = mockTerapeuta({ id: 'intruder-therapist' });
            const note = mockShadowNote({ therapistId: owner.id });
            shadowNotesRepo.findById.mockResolvedValue(note);

            await expect(
                service.update('shadow-note-uuid-001', { content: 'hacked' }, intruder)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('softDelete', () => {
        it('should soft delete shadow note for owner', async () => {
            const actor = mockTerapeuta();
            const note = mockShadowNote({ therapistId: actor.id });
            shadowNotesRepo.findById.mockResolvedValue(note);
            sessionsRepo.findById.mockResolvedValue(mockClinicalSession());

            await service.softDelete('shadow-note-uuid-001', actor);

            expect(shadowNotesRepo.softDelete).toHaveBeenCalledWith('shadow-note-uuid-001');
            expect(auditService.log).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'DELETE',
                    details: { softDelete: true },
                })
            );
        });

        it('should throw ForbiddenException when non-owner tries to delete', async () => {
            const owner = mockTerapeuta({ id: 'owner-therapist' });
            const intruder = mockTerapeuta({ id: 'intruder-therapist' });
            const note = mockShadowNote({ therapistId: owner.id });
            shadowNotesRepo.findById.mockResolvedValue(note);

            await expect(
                service.softDelete('shadow-note-uuid-001', intruder)
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('findMyNotes', () => {
        it('should return only metadata without content', async () => {
            const actor = mockTerapeuta();
            const notes = [
                mockShadowNote({ id: 'note-1', therapistId: actor.id }),
                mockShadowNote({ id: 'note-2', therapistId: actor.id }),
            ];
            shadowNotesRepo.findByTherapist.mockResolvedValue(notes);

            const result = await service.findMyNotes(actor);

            expect(result).toHaveLength(2);
            result.forEach(note => {
                // findMyNotes only returns metadata
                expect(note.id).toBeDefined();
                expect(note.sessionId).toBeDefined();
                // Encrypted content should NOT be exposed
                expect((note as any).contentEncrypted).toBeUndefined();
            });
        });
    });
});
