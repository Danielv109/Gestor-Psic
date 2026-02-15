// =============================================================================
// WORKFLOW API
// Primary API for session state transitions
// =============================================================================

import { get, post } from './client';
import type {
    WorkflowStatus,
    WorkflowResult,
    StartSessionDto,
    EndSessionDto,
    SignSessionDto,
    CancelAppointmentDto
} from '../types';

// =============================================================================
// APPOINTMENT TRANSITIONS
// =============================================================================

export async function getWorkflowStatus(appointmentId: string): Promise<WorkflowStatus> {
    return get<WorkflowStatus>(`/workflow/appointment/${appointmentId}/status`);
}

export async function confirmAppointment(appointmentId: string): Promise<WorkflowResult> {
    return post<WorkflowResult>(`/workflow/appointment/${appointmentId}/confirm`);
}

export async function markNoShow(appointmentId: string): Promise<WorkflowResult> {
    return post<WorkflowResult>(`/workflow/appointment/${appointmentId}/no-show`);
}

export async function cancelAppointment(
    appointmentId: string,
    dto: CancelAppointmentDto
): Promise<WorkflowResult> {
    return post<WorkflowResult>(`/workflow/appointment/${appointmentId}/cancel`, dto);
}

// =============================================================================
// SESSION LIFECYCLE
// =============================================================================

export async function startSession(
    appointmentId: string,
    dto?: StartSessionDto
): Promise<WorkflowResult> {
    return post<WorkflowResult>(`/workflow/appointment/${appointmentId}/start-session`, dto || {});
}

export async function endSession(
    sessionId: string,
    dto: EndSessionDto
): Promise<WorkflowResult> {
    return post<WorkflowResult>(`/workflow/session/${sessionId}/end`, dto);
}

/**
 * Sign session - IRREVERSIBLE ACTION
 * Only the therapist owner can sign.
 * Session must be ended (endedAt set) and have narrative content.
 */
export async function signSession(
    sessionId: string,
    dto: SignSessionDto
): Promise<WorkflowResult> {
    return post<WorkflowResult>(`/workflow/session/${sessionId}/sign`, dto);
}
