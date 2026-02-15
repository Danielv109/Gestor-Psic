// =============================================================================
// APPOINTMENTS API
// =============================================================================

import { get, post, put, del } from './client';
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto, CancelAppointmentDto } from '../types';

export async function getUpcomingAppointments(): Promise<Appointment[]> {
    return get<Appointment[]>('/appointments/upcoming');
}

export async function getAppointmentsByRange(start: string, end: string): Promise<Appointment[]> {
    return get<Appointment[]>(`/appointments/range?start=${start}&end=${end}`);
}

export async function getAppointmentById(id: string): Promise<Appointment> {
    return get<Appointment>(`/appointments/${id}`);
}

export async function createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
    return post<Appointment>('/appointments', dto);
}

export async function updateAppointment(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    return put<Appointment>(`/appointments/${id}`, dto);
}

export async function confirmAppointment(id: string): Promise<Appointment> {
    return post<Appointment>(`/appointments/${id}/confirm`);
}

export async function cancelAppointment(id: string, dto: CancelAppointmentDto): Promise<Appointment> {
    return post<Appointment>(`/appointments/${id}/cancel`, dto);
}

export async function deleteAppointment(id: string): Promise<void> {
    return del(`/appointments/${id}`);
}
