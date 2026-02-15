// =============================================================================
// USE FORM HOOK
// Backend-first validation with 400 error mapping
//
// ⚠️ RULES:
// - Minimal client validation (only empty required fields)
// - Backend is always the authority
// - 400 errors map to specific fields
// - Inputs preserved on error
// - Submit disabled while loading
// =============================================================================

import { useState, useCallback } from 'react';
import { ApiClientError } from '../api/client';
import type { ValidationError } from '../types';

export interface FieldError {
    field: string;
    message: string;
}

export interface FormState<T> {
    /** Form values */
    values: T;
    /** Field-level errors from backend */
    fieldErrors: Record<string, string>;
    /** Global error (non-field specific) */
    globalError: string;
    /** Is form submitting */
    isSubmitting: boolean;
    /** Has form been touched */
    isDirty: boolean;
}

export interface UseFormOptions<T> {
    /** Initial form values */
    initialValues: T;
    /** Submit handler - should throw ApiClientError on failure */
    onSubmit: (values: T) => Promise<void>;
    /** Success callback */
    onSuccess?: () => void;
}

export interface UseFormReturn<T> extends FormState<T> {
    /** Update a single field */
    setField: <K extends keyof T>(field: K, value: T[K]) => void;
    /** Update multiple fields */
    setFields: (updates: Partial<T>) => void;
    /** Submit the form */
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
    /** Reset form to initial values */
    reset: () => void;
    /** Clear all errors */
    clearErrors: () => void;
    /** Clear a specific field error */
    clearFieldError: (field: keyof T) => void;
    /** Get error for a field */
    getFieldError: (field: keyof T) => string | undefined;
    /** Check if field has error */
    hasFieldError: (field: keyof T) => boolean;
}

export function useForm<T extends object>({
    initialValues,
    onSubmit,
    onSuccess,
}: UseFormOptions<T>): UseFormReturn<T> {
    const [values, setValues] = useState<T>(initialValues);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [globalError, setGlobalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Update a single field - clears its error
    const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => {
            const { [field as string]: _, ...rest } = prev;
            return rest;
        });
        setIsDirty(true);
    }, []);

    // Update multiple fields
    const setFields = useCallback((updates: Partial<T>) => {
        setValues(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
        // Clear errors for updated fields
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            Object.keys(updates).forEach(key => delete newErrors[key]);
            return newErrors;
        });
    }, []);

    // Clear all errors
    const clearErrors = useCallback(() => {
        setFieldErrors({});
        setGlobalError('');
    }, []);

    // Clear a specific field error
    const clearFieldError = useCallback((field: keyof T) => {
        setFieldErrors(prev => {
            const { [field as string]: _, ...rest } = prev;
            return rest;
        });
    }, []);

    // Get field error
    const getFieldError = useCallback((field: keyof T): string | undefined => {
        return fieldErrors[field as string];
    }, [fieldErrors]);

    // Check if field has error
    const hasFieldError = useCallback((field: keyof T): boolean => {
        return !!fieldErrors[field as string];
    }, [fieldErrors]);

    // Reset form
    const reset = useCallback(() => {
        setValues(initialValues);
        setFieldErrors({});
        setGlobalError('');
        setIsDirty(false);
    }, [initialValues]);

    // Map backend validation errors to field errors
    const mapValidationErrors = useCallback((errors: ValidationError[]): Record<string, string> => {
        const mapped: Record<string, string> = {};

        errors.forEach(error => {
            // Get first constraint message
            const constraints = Object.values(error.constraints);
            if (constraints.length > 0) {
                mapped[error.field] = constraints[0];
            }
        });

        return mapped;
    }, []);

    // Submit handler
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Don't submit if already submitting
        if (isSubmitting) return;

        setIsSubmitting(true);
        clearErrors();

        try {
            await onSubmit(values);
            // Success - call callback but DON'T reset form (caller decides)
            onSuccess?.();
        } catch (err) {
            // Map API errors
            if (err instanceof ApiClientError) {
                // Check for validation errors (400)
                if (err.validationErrors && err.validationErrors.length > 0) {
                    const mapped = mapValidationErrors(err.validationErrors);
                    setFieldErrors(mapped);
                } else {
                    // Global error with specific message
                    setGlobalError(err.message);
                }
            } else if (err instanceof Error) {
                setGlobalError(err.message);
            } else {
                setGlobalError('Ha ocurrido un error inesperado');
            }
            // DON'T clear values - preserve user input
        } finally {
            setIsSubmitting(false);
        }
    }, [values, onSubmit, onSuccess, isSubmitting, clearErrors, mapValidationErrors]);

    return {
        values,
        fieldErrors,
        globalError,
        isSubmitting,
        isDirty,
        setField,
        setFields,
        handleSubmit,
        reset,
        clearErrors,
        clearFieldError,
        getFieldError,
        hasFieldError,
    };
}
