"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLegalStateMachine = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const amendment_interfaces_1 = require("./interfaces/amendment.interfaces");
let SessionLegalStateMachine = class SessionLegalStateMachine {
    constructor() {
        this.IMMUTABLE_STATES = [
            client_1.SessionLegalStatus.SIGNED,
            client_1.SessionLegalStatus.AMENDED,
            client_1.SessionLegalStatus.VOIDED,
        ];
        this.FINAL_STATES = [
            client_1.SessionLegalStatus.VOIDED,
        ];
    }
    canTransition(currentState, targetState) {
        const allowedTransitions = amendment_interfaces_1.LEGAL_STATUS_TRANSITIONS[currentState];
        return allowedTransitions?.includes(targetState) ?? false;
    }
    validateTransition(currentState, targetState, sessionId) {
        if (currentState === targetState) {
            return;
        }
        if (this.isFinal(currentState)) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Sesión ${sessionId} en estado final ${currentState}. No se permiten más cambios.`,
                currentState,
                targetState,
            });
        }
        if (!this.canTransition(currentState, targetState)) {
            throw new common_1.ConflictException({
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
    validateCanUpdate(legalStatus, isLocked, sessionId) {
        if (isLocked) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Sesión ${sessionId} está firmada (isLocked=true). No se pueden modificar datos.`,
            });
        }
        if (this.isImmutable(legalStatus)) {
            throw new common_1.ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Sesión ${sessionId} en estado ${legalStatus}. Solo addendums permitidos.`,
            });
        }
    }
    validateCanDelete(hasLegalHold, sessionId) {
        if (hasLegalHold) {
            throw new common_1.ForbiddenException({
                statusCode: 423,
                error: 'Locked',
                message: `Sesión ${sessionId} bajo retención legal. Eliminación prohibida.`,
            });
        }
    }
    isImmutable(state) {
        return this.IMMUTABLE_STATES.includes(state);
    }
    isFinal(state) {
        return this.FINAL_STATES.includes(state);
    }
    getAvailableTransitions(state) {
        return amendment_interfaces_1.LEGAL_STATUS_TRANSITIONS[state] ?? [];
    }
    canAmend(state) {
        return this.getAvailableTransitions(state).includes(client_1.SessionLegalStatus.AMENDED);
    }
    canVoid(state) {
        return this.getAvailableTransitions(state).includes(client_1.SessionLegalStatus.VOIDED);
    }
    getStateDescription(state) {
        const descriptions = {
            [client_1.SessionLegalStatus.DRAFT]: 'Borrador (editable)',
            [client_1.SessionLegalStatus.PENDING_REVIEW]: 'Pendiente de revisión',
            [client_1.SessionLegalStatus.SIGNED]: 'Firmada (inmutable)',
            [client_1.SessionLegalStatus.AMENDED]: 'Enmendada (con addendums)',
            [client_1.SessionLegalStatus.VOIDED]: 'Anulada (final)',
        };
        return descriptions[state] || state;
    }
};
exports.SessionLegalStateMachine = SessionLegalStateMachine;
exports.SessionLegalStateMachine = SessionLegalStateMachine = __decorate([
    (0, common_1.Injectable)()
], SessionLegalStateMachine);
//# sourceMappingURL=session-legal-state-machine.js.map