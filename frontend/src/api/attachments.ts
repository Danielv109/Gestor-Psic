import { apiClient, getAccessToken } from './client';
import type { PatientAttachment } from '../types';

const API_BASE_URL = '/api';

export const attachmentsApi = {
    /** Get all attachments for a patient */
    getByPatient: (patientId: string) =>
        apiClient<PatientAttachment[]>(`/patients/${patientId}/attachments`),

    /** Upload a file attachment */
    upload: async (
        patientId: string,
        file: File,
        metadata?: { category?: string; description?: string; sessionId?: string },
    ): Promise<PatientAttachment> => {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata?.category) formData.append('category', metadata.category);
        if (metadata?.description) formData.append('description', metadata.description);
        if (metadata?.sessionId) formData.append('sessionId', metadata.sessionId);

        const token = getAccessToken();
        const res = await fetch(`${API_BASE_URL}/patients/${patientId}/attachments`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Error al subir archivo' }));
            throw error;
        }

        return res.json();
    },

    /** Get download URL for an attachment */
    getDownloadUrl: (id: string) => `${API_BASE_URL}/attachments/${id}/download`,

    /** Delete an attachment */
    delete: (id: string) =>
        apiClient<void>(`/attachments/${id}`, { method: 'DELETE' }),
};
