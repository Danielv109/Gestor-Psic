"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentStateMachine = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const workflow_interfaces_1 = require("./interfaces/workflow.interfaces");
let AppointmentStateMachine = class AppointmentStateMachine {
    canTransition(currentState, targetState) {
        const allowedTransitions = workflow_interfaces_1.APPOINTMENT_TRANSITIONS[currentState];
        return allowedTransitions.includes(targetState);
    }
    validateTransition(currentState, targetState, appointmentId) {
        if (currentState === targetState) {
            return;
        }
        if (workflow_interfaces_1.FINAL_STATES.includes(currentState)) {
            throw new workflow_interfaces_1.StateTransitionError(`La cita ya está en estado final: ${currentState}`, currentState, targetState, 'APPOINTMENT', appointmentId);
        }
        if (!this.canTransition(currentState, targetState)) {
            throw new workflow_interfaces_1.StateTransitionError(`Transición inválida: ${currentState} → ${targetState}`, currentState, targetState, 'APPOINTMENT', appointmentId);
        }
    }
    getNextState(currentState) {
        switch (currentState) {
            case client_1.AppointmentStatus.SCHEDULED:
                return client_1.AppointmentStatus.CONFIRMED;
            case client_1.AppointmentStatus.CONFIRMED:
                return client_1.AppointmentStatus.IN_PROGRESS;
            case client_1.AppointmentStatus.IN_PROGRESS:
                return client_1.AppointmentStatus.COMPLETED;
            default:
                return null;
        }
    }
    canCreateSession(state) {
        return state === client_1.AppointmentStatus.CONFIRMED;
    }
    isFinal(state) {
        return workflow_interfaces_1.FINAL_STATES.includes(state);
    }
    getAvailableTransitions(state) {
        return workflow_interfaces_1.APPOINTMENT_TRANSITIONS[state] || [];
    }
    getStateDescription(state) {
        const descriptions = {
            [client_1.AppointmentStatus.SCHEDULED]: 'Programada',
            [client_1.AppointmentStatus.CONFIRMED]: 'Confirmada',
            [client_1.AppointmentStatus.IN_PROGRESS]: 'En Progreso',
            [client_1.AppointmentStatus.COMPLETED]: 'Completada',
            [client_1.AppointmentStatus.CANCELLED]: 'Cancelada',
            [client_1.AppointmentStatus.NO_SHOW]: 'Paciente No Asistió',
        };
        return descriptions[state] || state;
    }
};
exports.AppointmentStateMachine = AppointmentStateMachine;
exports.AppointmentStateMachine = AppointmentStateMachine = __decorate([
    (0, common_1.Injectable)()
], AppointmentStateMachine);
//# sourceMappingURL=appointment-state-machine.js.map