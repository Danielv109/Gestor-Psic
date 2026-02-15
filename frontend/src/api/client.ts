// =============================================================================
// API CLIENT
// Centralized Fetch API wrapper with robust error handling
// =============================================================================

import type { ApiError } from '../types';

const API_BASE_URL = '/api';

// =============================================================================
// TOKEN MANAGEMENT (memory only)
// =============================================================================

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
    accessToken = token;
}

export function getAccessToken(): string | null {
    return accessToken;
}

export function clearAccessToken(): void {
    accessToken = null;
}

// =============================================================================
// REFRESH TOKEN QUEUE
// Handles multiple 401 requests in parallel without multiple refresh calls
// =============================================================================

let isRefreshing = false;
let refreshQueue: Array<{
    resolve: (value: boolean) => void;
    reject: (error: Error) => void;
}> = [];

function processQueue(success: boolean): void {
    refreshQueue.forEach(({ resolve }) => resolve(success));
    refreshQueue = [];
}

async function refreshTokens(): Promise<boolean> {
    // If already refreshing, wait in queue
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // httpOnly cookie
            headers: {
                'Content-Type': 'application/json',
            },
            // NO body - backend reads from httpOnly cookie
        });

        if (!response.ok) {
            processQueue(false);
            return false;
        }

        const data = await response.json();
        setAccessToken(data.accessToken);
        processQueue(true);
        return true;
    } catch {
        processQueue(false);
        return false;
    } finally {
        isRefreshing = false;
    }
}

// =============================================================================
// ERROR CLASS
// =============================================================================

export class ApiClientError extends Error {
    statusCode: number;
    error: string;
    validationErrors?: ApiError['validationErrors'];
    isRetryable: boolean;

    constructor(apiError: ApiError, isRetryable = false) {
        super(apiError.message);
        this.name = 'ApiClientError';
        this.statusCode = apiError.statusCode;
        this.error = apiError.error;
        this.validationErrors = apiError.validationErrors;
        this.isRetryable = isRetryable;
    }

    // 400 - Validation errors
    get isValidationError(): boolean {
        return this.statusCode === 400;
    }

    // 401 - Unauthorized (after refresh failed)
    get isUnauthorized(): boolean {
        return this.statusCode === 401;
    }

    // 403 - Forbidden (role/ownership)
    get isForbidden(): boolean {
        return this.statusCode === 403;
    }

    // 404 - Not found
    get isNotFound(): boolean {
        return this.statusCode === 404;
    }

    // 409 - Conflict (legal state, duplicate)
    get isConflict(): boolean {
        return this.statusCode === 409;
    }

    // 410 - Gone (soft deleted)
    get isGone(): boolean {
        return this.statusCode === 410;
    }

    // 423 - Locked (legal hold)
    get isLocked(): boolean {
        return this.statusCode === 423;
    }

    // 429 - Rate limited
    get isRateLimited(): boolean {
        return this.statusCode === 429;
    }
}

// =============================================================================
// MAIN API CLIENT
// =============================================================================

interface RequestOptions extends Omit<RequestInit, 'body'> {
    skipAuth?: boolean;
    body?: unknown;
}

async function parseResponse<T>(response: Response): Promise<T> {
    // 204 No Content - return undefined without parsing
    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();

    // Empty response body
    if (!text) {
        return undefined as T;
    }

    // Parse JSON
    try {
        return JSON.parse(text);
    } catch {
        // If not JSON, return as-is (shouldn't happen with this API)
        return text as T;
    }
}

function buildError(status: number, message: string, error = 'Error'): ApiError {
    return { statusCode: status, message, error };
}

export async function apiClient<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { skipAuth = false, body, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    // Add auth header if token exists and auth not skipped
    if (!skipAuth && accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
        ...fetchOptions,
        credentials: 'include', // Always send httpOnly cookies
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // =============================================================================
    // SUCCESS RESPONSES (200, 201, 204)
    // =============================================================================
    if (response.ok) {
        return parseResponse<T>(response);
    }

    // =============================================================================
    // 401 UNAUTHORIZED - Attempt refresh ONCE
    // =============================================================================
    if (response.status === 401 && !skipAuth) {
        const refreshed = await refreshTokens();

        if (refreshed) {
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${accessToken}`;

            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...config,
                headers,
            });

            if (retryResponse.ok) {
                return parseResponse<T>(retryResponse);
            }

            // Retry also failed with 401 - give up
            if (retryResponse.status === 401) {
                clearAccessToken();
                window.location.href = '/login';
                throw new ApiClientError(
                    buildError(401, 'Sesión expirada. Por favor inicia sesión nuevamente.', 'Unauthorized')
                );
            }

            // Retry failed with different error
            const retryError = await parseResponse<ApiError>(retryResponse);
            throw new ApiClientError(retryError);
        }

        // Refresh failed - redirect to login
        clearAccessToken();
        window.location.href = '/login';
        throw new ApiClientError(
            buildError(401, 'Sesión expirada. Por favor inicia sesión nuevamente.', 'Unauthorized')
        );
    }

    // =============================================================================
    // ERROR RESPONSES
    // =============================================================================

    let apiError: ApiError;
    try {
        apiError = await parseResponse<ApiError>(response);
    } catch {
        apiError = buildError(response.status, response.statusText || 'Error desconocido');
    }

    // Ensure proper structure
    if (!apiError || typeof apiError !== 'object') {
        apiError = buildError(response.status, 'Error desconocido');
    }

    switch (response.status) {
        // 400 - Validation Error
        case 400:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'Datos inválidos. Verifica los campos.',
            });

        // 403 - Forbidden
        case 403:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'No tienes permisos para realizar esta acción.',
            });

        // 404 - Not Found
        case 404:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'Recurso no encontrado.',
            });

        // 409 - Conflict (legal state transitions, duplicates)
        case 409:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'Conflicto: la operación no puede completarse.',
            });

        // 410 - Gone (soft deleted)
        case 410:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'Este recurso ha sido eliminado.',
            });

        // 423 - Locked (legal hold)
        case 423:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'Recurso bloqueado por retención legal.',
            });

        // 429 - Rate Limited
        case 429:
            throw new ApiClientError(
                {
                    ...apiError,
                    message: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.',
                },
                true // isRetryable
            );

        // 500+ - Server errors
        default:
            throw new ApiClientError({
                ...apiError,
                message: apiError.message || 'Error del servidor. Intenta más tarde.',
            });
    }
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

export function get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

export function post<T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'POST', body: data });
}

export function put<T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'PUT', body: data });
}

export function patch<T>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'PATCH', body: data });
}

export function del<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}
