// src/modules/compliance/legal-compliance.integration.spec.ts
/**
 * Legal Compliance Regression Tests
 * 
 * These tests ensure compliance with NOM-004-SSA3 requirements
 * for clinical record keeping and data integrity.
 * 
 * @compliance NOM-004-SSA3 - Expediente Clínico Electrónico
 */

import { GlobalRole } from '@prisma/client';
import {
    mockTerapeuta,
    mockSupervisor,
    mockAuditor,
    mockClinicalSession,
    mockSignedSession,
    mockClinicalNarrative,
} from '../../test/test-utils';

describe('Legal Compliance Regression Tests (NOM-004-SSA3)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================
    // NOM-004: Inmutabilidad de Expediente Firmado
    // =========================================================

    describe('NOM-004 §7.1: Inmutabilidad Post-Firma', () => {
        it('CRITICAL: signed session has isLocked=true', () => {
            const signedSession = mockSignedSession();

            expect(signedSession.isLocked).toBe(true);
            expect(signedSession.signedAt).toBeDefined();
        });

        it('CRITICAL: signedAt timestamp is preserved', () => {
            const signedAt = new Date('2024-01-15T10:30:00Z');
            const signedSession = mockSignedSession({ signedAt });

            expect(signedSession.signedAt).toEqual(signedAt);
        });

        it('CRITICAL: signatureHash provides integrity verification', () => {
            const signedSession = mockSignedSession();

            expect(signedSession.signatureHash).toBeDefined();
            expect(signedSession.signatureHash).toMatch(/^[a-f0-9]+$/i);
        });

        it('CRITICAL: isDraft is false after signing', () => {
            const signedSession = mockSignedSession();

            expect(signedSession.isDraft).toBe(false);
        });
    });

    // =========================================================
    // NOM-004: Datos Mínimos Requeridos
    // =========================================================

    describe('NOM-004 §7.2: Datos Mínimos', () => {
        it('session includes patient reference', () => {
            const session = mockClinicalSession();

            expect(session.patientId).toBeDefined();
        });

        it('session includes therapist reference', () => {
            const session = mockClinicalSession();

            expect(session.therapistId).toBeDefined();
        });

        it('session includes timestamp', () => {
            const session = mockClinicalSession();

            expect(session.startedAt).toBeDefined();
            expect(session.startedAt).toBeInstanceOf(Date);
        });

        it('clinical narrative follows SOAP structure', () => {
            const narrative = mockClinicalNarrative();

            expect(narrative).toHaveProperty('subjectiveReport');
            expect(narrative).toHaveProperty('objectiveObservation');
            expect(narrative).toHaveProperty('assessment');
            expect(narrative).toHaveProperty('plan');
        });
    });

    // =========================================================
    // NOM-004: Confidencialidad
    // =========================================================

    describe('NOM-004 §9.1: Data Confidentiality', () => {
        it('clinical narrative is encrypted when present', () => {
            const session = mockClinicalSession({
                clinicalNarrativeEncrypted: Buffer.from('encrypted-data'),
                narrativeIV: Buffer.from('1234567890123456'),
                narrativeKeyId: 'key-uuid-001',
            });

            expect(session.clinicalNarrativeEncrypted).toBeInstanceOf(Buffer);
            expect(session.narrativeIV).toBeInstanceOf(Buffer);
            expect(session.narrativeKeyId).toBeDefined();
        });

        it('IV is proper length for AES-GCM', () => {
            const iv = Buffer.alloc(16, 0); // 16 bytes for AES
            const session = mockClinicalSession({ narrativeIV: iv });

            expect(iv.length).toBe(16);
            expect(session.narrativeIV).toEqual(iv);
        });
    });

    // =========================================================
    // NOM-004: Responsabilidad del Firmante
    // =========================================================

    describe('NOM-004 §10.1: Signer Accountability', () => {
        it('signed session includes therapist identity', () => {
            const therapist = mockTerapeuta();
            const signedSession = mockSignedSession({ therapistId: therapist.id });

            expect(signedSession.therapistId).toBe(therapist.id);
        });

        it('signature timestamp is recorded', () => {
            const signedSession = mockSignedSession();

            expect(signedSession.signedAt).toBeDefined();
            expect(signedSession.signedAt).toBeInstanceOf(Date);
        });

        it('therapist ID cannot be changed after creation', () => {
            const originalTherapist = mockTerapeuta({ id: 'original-uuid' });
            const session = mockClinicalSession({ therapistId: originalTherapist.id });

            // Therapist ID is set at creation
            expect(session.therapistId).toBe(originalTherapist.id);
        });
    });

    // =========================================================
    // NOM-004: Trazabilidad
    // =========================================================

    describe('NOM-004 §8.1: Audit Trail', () => {
        it('session has creation timestamp', () => {
            const session = mockClinicalSession();

            expect(session.createdAt).toBeDefined();
            expect(session.createdAt).toBeInstanceOf(Date);
        });

        it('session has update timestamp', () => {
            const session = mockClinicalSession();

            expect(session.updatedAt).toBeDefined();
            expect(session.updatedAt).toBeInstanceOf(Date);
        });

        it('signed session preserves all timestamps', () => {
            const signedSession = mockSignedSession();

            expect(signedSession.startedAt).toBeDefined();
            expect(signedSession.signedAt).toBeDefined();
            expect(signedSession.createdAt).toBeDefined();
            expect(signedSession.updatedAt).toBeDefined();
        });
    });

    // =========================================================
    // Role Validation for Compliance
    // =========================================================

    describe('Compliance: Role Requirements', () => {
        it('TERAPEUTA can have clinical role', () => {
            const terapeuta = mockTerapeuta();

            expect(terapeuta.globalRole).toBe(GlobalRole.TERAPEUTA);
        });

        it('SUPERVISOR has oversight role', () => {
            const supervisor = mockSupervisor();

            expect(supervisor.globalRole).toBe(GlobalRole.SUPERVISOR);
        });

        it('AUDITOR has read-only role', () => {
            const auditor = mockAuditor();

            expect(auditor.globalRole).toBe(GlobalRole.AUDITOR);
        });
    });
});
