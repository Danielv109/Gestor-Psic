// src/modules/workflow/session-legal-state-machine.ts
import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { SessionLegalStatus } from '@prisma/client';
import { LEGAL_STATUS_TRANSITIONS } from './interfaces/amendment.interfaces';

/**
 * SessionLegalStateMachine
 * 
 * Valida transiciones de legalStatus para sesiones clínicas.
 * GARANTIZA:
 * - Sesión firmada NO puede volver a DRAFT
 * - Legal Hold bloquea delete y update
 * - Estados finales son inmutables
 * 
 * Transiciones válidas:
 * DRAFT → PENDING_REVIEW
 * PENDING_REVIEW → SIGNED | DRAFT
 * SIGNED → AMENDED | VOIDED
 * AMENDED → VOIDED
 * VOIDED → (ninguna - final)
 */
@Injectable()
export class SessionLegalStateMachine {
    // Estados que bloquean modificación
    private readonly IMMUTABLE_STATES: SessionLegalStatus[] = [
        SessionLegalStatus.SIGNED,
        SessionLegalStatus.AMENDED,
        SessionLegalStatus.VOIDED,
    ];

    // Estados finales
    private readonly FINAL_STATES: SessionLegalStatus[] = [
        SessionLegalStatus.VOIDED,
    ];

    /**
     * Verificar si una transición es válida
     */
    canTransition(
        currentState: SessionLegalStatus,
        targetState: SessionLegalStatus,
    ): boolean {
        const allowedTransitions = LEGAL_STATUS_TRANSITIONS[currentState];
        return allowedTransitions?.includes(targetState) ?? false;
    }

    /**
     * Validar transición y lanzar 409 Conflict si es inválida
     */
    validateTransition(
        currentState: SessionLegalStatus,
        targetState: SessionLegalStatus,
        sessionId: string,
    ): void {
        if (currentState === targetState) {
            return; // No-op
        }

        if (this.isFinal(currentState)) {
            throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Sesión ${sessionId} en estado final ${currentState}. No se permiten más cambios.`,
                currentState,
                targetState,
            });
        }

        if (!this.canTransition(currentState, targetState)) {
            throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Transición inválida: ${currentState} → ${targetState}. ` +
                    `Transiciones permitidas: ${this.getAvailableTransitions(currentState).join(', ') || 'ninguna'}`,
                currentState,
                targetState,
                allowedTransitions: this.getAvailableTransitions(currentState),
            });
        }
    }

    /**
     * Validar que la sesión NO está firmada/bloqueada para update
     */
    validateCanUpdate(
        legalStatus: SessionLegalStatus,
        isLocked: boolean,
        sessionId: string,
    ): void {
        if (isLocked) {
            throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Sesión ${sessionId} está firmada (isLocked=true). No se pueden modificar datos.`,
            });
        }

        if (this.isImmutable(legalStatus)) {
            throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Sesión ${sessionId} en estado ${legalStatus}. Solo addendums permitidos.`,
            });
        }
    }

    /**
     * Validar que la sesión NO tiene Legal Hold para delete
     * NOTA: Sessions con Legal Hold NO pueden eliminarse
     */
    validateCanDelete(
        hasLegalHold: boolean,
        sessionId: string,
    ): void {
        if (hasLegalHold) {
            throw new ForbiddenException({
                statusCode: 423, // Locked
                error: 'Locked',
                message: `Sesión ${sessionId} bajo retención legal. Eliminación prohibida.`,
            });
        }
    }

    /**
     * Verificar si el estado es inmutable (no permite update directo)
     */
    isImmutable(state: SessionLegalStatus): boolean {
        return this.IMMUTABLE_STATES.includes(state);
    }

    /**
     * Verificar si el estado es final
     */
    isFinal(state: SessionLegalStatus): boolean {
        return this.FINAL_STATES.includes(state);
    }

    /**
     * Obtener transiciones disponibles
     */
    getAvailableTransitions(state: SessionLegalStatus): SessionLegalStatus[] {
        return LEGAL_STATUS_TRANSITIONS[state] ?? [];
    }

    /**
     * Verificar si puede crear addendum
     */
    canAmend(state: SessionLegalStatus): boolean {
        return this.getAvailableTransitions(state).includes(SessionLegalStatus.AMENDED);
    }

    /**
     * Verificar si puede anular
     */
    canVoid(state: SessionLegalStatus): boolean {
        return this.getAvailableTransitions(state).includes(SessionLegalStatus.VOIDED);
    }

    /**
     * Descripción amigable del estado
     */
    getStateDescription(state: SessionLegalStatus): string {
        const descriptions: Record<SessionLegalStatus, string> = {
            [SessionLegalStatus.DRAFT]: 'Borrador (editable)',
            [SessionLegalStatus.PENDING_REVIEW]: 'Pendiente de revisión',
            [SessionLegalStatus.SIGNED]: 'Firmada (inmutable)',
            [SessionLegalStatus.AMENDED]: 'Enmendada (con addendums)',
            [SessionLegalStatus.VOIDED]: 'Anulada (final)',
        };
        return descriptions[state] || state;
    }
}
