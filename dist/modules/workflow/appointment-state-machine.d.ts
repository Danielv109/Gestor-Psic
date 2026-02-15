import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentStateMachine {
    canTransition(currentState: AppointmentStatus, targetState: AppointmentStatus): boolean;
    validateTransition(currentState: AppointmentStatus, targetState: AppointmentStatus, appointmentId: string): void;
    getNextState(currentState: AppointmentStatus): AppointmentStatus | null;
    canCreateSession(state: AppointmentStatus): boolean;
    isFinal(state: AppointmentStatus): boolean;
    getAvailableTransitions(state: AppointmentStatus): AppointmentStatus[];
    getStateDescription(state: AppointmentStatus): string;
}
