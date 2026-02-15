import { SessionLegalStatus } from '@prisma/client';
export declare class SessionLegalStateMachine {
    private readonly IMMUTABLE_STATES;
    private readonly FINAL_STATES;
    canTransition(currentState: SessionLegalStatus, targetState: SessionLegalStatus): boolean;
    validateTransition(currentState: SessionLegalStatus, targetState: SessionLegalStatus, sessionId: string): void;
    validateCanUpdate(legalStatus: SessionLegalStatus, isLocked: boolean, sessionId: string): void;
    validateCanDelete(hasLegalHold: boolean, sessionId: string): void;
    isImmutable(state: SessionLegalStatus): boolean;
    isFinal(state: SessionLegalStatus): boolean;
    getAvailableTransitions(state: SessionLegalStatus): SessionLegalStatus[];
    canAmend(state: SessionLegalStatus): boolean;
    canVoid(state: SessionLegalStatus): boolean;
    getStateDescription(state: SessionLegalStatus): string;
}
