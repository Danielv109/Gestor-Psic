// src/modules/workflow/state-transitions.spec.ts
/**
 * Tests for State Transitions
 * 
 * Verifies:
 * - Invalid transitions return 409 Conflict
 * - Signed session cannot return to DRAFT
 * - Legal Hold blocks delete/update
 * - Final states are immutable
 */

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SessionLegalStatus, AppointmentStatus } from '@prisma/client';
import { SessionLegalStateMachine } from './session-legal-state-machine';
import { AppointmentStateMachine } from './appointment-state-machine';

describe('State Transitions', () => {
    describe('SessionLegalStateMachine', () => {
        let stateMachine: SessionLegalStateMachine;

        beforeEach(() => {
            stateMachine = new SessionLegalStateMachine();
        });

        describe('Valid Transitions', () => {
            it('should allow DRAFT → PENDING_REVIEW', () => {
                expect(
                    stateMachine.canTransition(
                        SessionLegalStatus.DRAFT,
                        SessionLegalStatus.PENDING_REVIEW,
                    ),
                ).toBe(true);
            });

            it('should allow PENDING_REVIEW → SIGNED', () => {
                expect(
                    stateMachine.canTransition(
                        SessionLegalStatus.PENDING_REVIEW,
                        SessionLegalStatus.SIGNED,
                    ),
                ).toBe(true);
            });

            it('should allow SIGNED → AMENDED', () => {
                expect(
                    stateMachine.canTransition(
                        SessionLegalStatus.SIGNED,
                        SessionLegalStatus.AMENDED,
                    ),
                ).toBe(true);
            });

            it('should allow SIGNED → VOIDED', () => {
                expect(
                    stateMachine.canTransition(
                        SessionLegalStatus.SIGNED,
                        SessionLegalStatus.VOIDED,
                    ),
                ).toBe(true);
            });
        });

        describe('Invalid Transitions → 409 Conflict', () => {
            it('should reject SIGNED → DRAFT (cannot undo signature)', () => {
                expect(() =>
                    stateMachine.validateTransition(
                        SessionLegalStatus.SIGNED,
                        SessionLegalStatus.DRAFT,
                        'session-123',
                    ),
                ).toThrow(ConflictException);
            });

            it('should reject SIGNED → PENDING_REVIEW', () => {
                expect(() =>
                    stateMachine.validateTransition(
                        SessionLegalStatus.SIGNED,
                        SessionLegalStatus.PENDING_REVIEW,
                        'session-123',
                    ),
                ).toThrow(ConflictException);
            });

            it('should reject AMENDED → DRAFT', () => {
                expect(() =>
                    stateMachine.validateTransition(
                        SessionLegalStatus.AMENDED,
                        SessionLegalStatus.DRAFT,
                        'session-123',
                    ),
                ).toThrow(ConflictException);
            });

            it('should reject VOIDED → any (final state)', () => {
                expect(() =>
                    stateMachine.validateTransition(
                        SessionLegalStatus.VOIDED,
                        SessionLegalStatus.DRAFT,
                        'session-123',
                    ),
                ).toThrow(ConflictException);
            });

            it('should reject DRAFT → SIGNED (must review first)', () => {
                expect(
                    stateMachine.canTransition(
                        SessionLegalStatus.DRAFT,
                        SessionLegalStatus.SIGNED,
                    ),
                ).toBe(false);
            });
        });

        describe('Immutable States', () => {
            it('should mark SIGNED as immutable', () => {
                expect(stateMachine.isImmutable(SessionLegalStatus.SIGNED)).toBe(true);
            });

            it('should mark AMENDED as immutable', () => {
                expect(stateMachine.isImmutable(SessionLegalStatus.AMENDED)).toBe(true);
            });

            it('should mark VOIDED as immutable', () => {
                expect(stateMachine.isImmutable(SessionLegalStatus.VOIDED)).toBe(true);
            });

            it('should NOT mark DRAFT as immutable', () => {
                expect(stateMachine.isImmutable(SessionLegalStatus.DRAFT)).toBe(false);
            });
        });

        describe('Update Validation', () => {
            it('should block update when isLocked=true', () => {
                expect(() =>
                    stateMachine.validateCanUpdate(
                        SessionLegalStatus.SIGNED,
                        true,
                        'session-123',
                    ),
                ).toThrow(ConflictException);
            });

            it('should block update in immutable state', () => {
                expect(() =>
                    stateMachine.validateCanUpdate(
                        SessionLegalStatus.SIGNED,
                        false,
                        'session-123',
                    ),
                ).toThrow(ConflictException);
            });

            it('should allow update in DRAFT', () => {
                expect(() =>
                    stateMachine.validateCanUpdate(
                        SessionLegalStatus.DRAFT,
                        false,
                        'session-123',
                    ),
                ).not.toThrow();
            });
        });

        describe('Legal Hold', () => {
            it('should block delete when hasLegalHold=true', () => {
                expect(() =>
                    stateMachine.validateCanDelete(true, 'session-123'),
                ).toThrow(ForbiddenException);
            });

            it('should allow delete when hasLegalHold=false', () => {
                expect(() =>
                    stateMachine.validateCanDelete(false, 'session-123'),
                ).not.toThrow();
            });
        });

        describe('Amendment Capabilities', () => {
            it('should allow amend from SIGNED', () => {
                expect(stateMachine.canAmend(SessionLegalStatus.SIGNED)).toBe(true);
            });

            it('should NOT allow amend from DRAFT', () => {
                expect(stateMachine.canAmend(SessionLegalStatus.DRAFT)).toBe(false);
            });

            it('should NOT allow amend from VOIDED', () => {
                expect(stateMachine.canAmend(SessionLegalStatus.VOIDED)).toBe(false);
            });
        });
    });

    describe('AppointmentStateMachine', () => {
        let stateMachine: AppointmentStateMachine;

        beforeEach(() => {
            stateMachine = new AppointmentStateMachine();
        });

        describe('Valid Transitions', () => {
            it('should allow SCHEDULED → CONFIRMED', () => {
                expect(
                    stateMachine.canTransition(
                        AppointmentStatus.SCHEDULED,
                        AppointmentStatus.CONFIRMED,
                    ),
                ).toBe(true);
            });

            it('should allow CONFIRMED → IN_PROGRESS', () => {
                expect(
                    stateMachine.canTransition(
                        AppointmentStatus.CONFIRMED,
                        AppointmentStatus.IN_PROGRESS,
                    ),
                ).toBe(true);
            });
        });

        describe('Invalid Transitions', () => {
            it('should reject COMPLETED → SCHEDULED (cannot reopen)', () => {
                expect(
                    stateMachine.canTransition(
                        AppointmentStatus.COMPLETED,
                        AppointmentStatus.SCHEDULED,
                    ),
                ).toBe(false);
            });

            it('should reject CANCELLED → CONFIRMED', () => {
                expect(
                    stateMachine.canTransition(
                        AppointmentStatus.CANCELLED,
                        AppointmentStatus.CONFIRMED,
                    ),
                ).toBe(false);
            });
        });

        describe('Final States', () => {
            it('should mark COMPLETED as final', () => {
                expect(stateMachine.isFinal(AppointmentStatus.COMPLETED)).toBe(true);
            });

            it('should mark CANCELLED as final', () => {
                expect(stateMachine.isFinal(AppointmentStatus.CANCELLED)).toBe(true);
            });

            it('should mark NO_SHOW as final', () => {
                expect(stateMachine.isFinal(AppointmentStatus.NO_SHOW)).toBe(true);
            });

            it('should NOT mark SCHEDULED as final', () => {
                expect(stateMachine.isFinal(AppointmentStatus.SCHEDULED)).toBe(false);
            });
        });
    });
});
