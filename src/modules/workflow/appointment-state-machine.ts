// src/modules/workflow/appointment-state-machine.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import {
    APPOINTMENT_TRANSITIONS,
    FINAL_STATES,
    StateTransitionError,
} from './interfaces/workflow.interfaces';

/**
 * AppointmentStateMachine
 * 
 * Valida y ejecuta transiciones de estado para citas.
 * Implementa el patrón State Machine para garantizar
 * que solo ocurran transiciones válidas.
 */
@Injectable()
export class AppointmentStateMachine {
    /**
     * Verificar si una transición es válida
     */
    canTransition(
        currentState: AppointmentStatus,
        targetState: AppointmentStatus,
    ): boolean {
        const allowedTransitions = APPOINTMENT_TRANSITIONS[currentState];
        return allowedTransitions.includes(targetState);
    }

    /**
     * Validar transición y lanzar error si es inválida
     */
    validateTransition(
        currentState: AppointmentStatus,
        targetState: AppointmentStatus,
        appointmentId: string,
    ): void {
        if (currentState === targetState) {
            return; // No-op, mismo estado
        }

        if (FINAL_STATES.includes(currentState)) {
            throw new StateTransitionError(
                `La cita ya está en estado final: ${currentState}`,
                currentState,
                targetState,
                'APPOINTMENT',
                appointmentId,
            );
        }

        if (!this.canTransition(currentState, targetState)) {
            throw new StateTransitionError(
                `Transición inválida: ${currentState} → ${targetState}`,
                currentState,
                targetState,
                'APPOINTMENT',
                appointmentId,
            );
        }
    }

    /**
     * Obtener estado siguiente esperado en el flujo normal
     */
    getNextState(currentState: AppointmentStatus): AppointmentStatus | null {
        switch (currentState) {
            case AppointmentStatus.SCHEDULED:
                return AppointmentStatus.CONFIRMED;
            case AppointmentStatus.CONFIRMED:
                return AppointmentStatus.IN_PROGRESS;
            case AppointmentStatus.IN_PROGRESS:
                return AppointmentStatus.COMPLETED;
            default:
                return null; // Estado final
        }
    }

    /**
     * Verificar si se puede crear sesión desde este estado
     */
    canCreateSession(state: AppointmentStatus): boolean {
        return state === AppointmentStatus.CONFIRMED;
    }

    /**
     * Verificar si la cita está en estado final
     */
    isFinal(state: AppointmentStatus): boolean {
        return FINAL_STATES.includes(state);
    }

    /**
     * Obtener transiciones disponibles desde un estado
     */
    getAvailableTransitions(state: AppointmentStatus): AppointmentStatus[] {
        return APPOINTMENT_TRANSITIONS[state] || [];
    }

    /**
     * Descripción amigable del estado
     */
    getStateDescription(state: AppointmentStatus): string {
        const descriptions: Record<AppointmentStatus, string> = {
            [AppointmentStatus.SCHEDULED]: 'Programada',
            [AppointmentStatus.CONFIRMED]: 'Confirmada',
            [AppointmentStatus.IN_PROGRESS]: 'En Progreso',
            [AppointmentStatus.COMPLETED]: 'Completada',
            [AppointmentStatus.CANCELLED]: 'Cancelada',
            [AppointmentStatus.NO_SHOW]: 'Paciente No Asistió',
        };
        return descriptions[state] || state;
    }
}
