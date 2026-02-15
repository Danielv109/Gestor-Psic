// =============================================================================
// AUTH API
// =============================================================================

import { post, setAccessToken, clearAccessToken } from './client';
import type { LoginResponse, User } from '../types';

interface LoginDto {
    email: string;
    password: string;
}

export async function login(dto: LoginDto): Promise<{ user: User }> {
    const response = await post<LoginResponse>('/auth/login', dto, { skipAuth: true });
    setAccessToken(response.accessToken);
    return { user: response.user };
}

export async function refresh(): Promise<boolean> {
    try {
        const response = await post<{ accessToken: string }>('/auth/refresh', undefined, {
            skipAuth: true,
        });
        setAccessToken(response.accessToken);
        return true;
    } catch {
        return false;
    }
}

export async function logout(): Promise<void> {
    try {
        await post('/auth/logout');
    } finally {
        clearAccessToken();
    }
}

export async function logoutAll(): Promise<{ revokedTokens: number }> {
    const result = await post<{ revokedTokens: number }>('/auth/logout-all');
    clearAccessToken();
    return result;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await post('/auth/change-password', { currentPassword, newPassword });
}
