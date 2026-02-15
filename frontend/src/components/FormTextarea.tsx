// =============================================================================
// FORM TEXTAREA COMPONENT
// Textarea with field-level error display
// =============================================================================

import styles from './FormTextarea.module.css';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Field label */
    label: string;
    /** Field error message */
    error?: string;
    /** Help text */
    helpText?: string;
}

export function FormTextarea({
    label,
    error,
    helpText,
    id,
    className,
    ...props
}: FormTextareaProps) {
    const inputId = id || props.name;
    const hasError = !!error;

    return (
        <div className={`${styles.formGroup} ${hasError ? styles.hasError : ''}`}>
            <label htmlFor={inputId} className={styles.label}>
                {label}
                {props.required && <span className={styles.required}>*</span>}
            </label>
            <textarea
                id={inputId}
                className={`${styles.textarea} ${className || ''}`}
                aria-invalid={hasError}
                aria-describedby={error ? `${inputId}-error` : undefined}
                {...props}
            />
            {error && (
                <span id={`${inputId}-error`} className={styles.error} role="alert">
                    {error}
                </span>
            )}
            {helpText && !error && (
                <span className={styles.helpText}>{helpText}</span>
            )}
        </div>
    );
}
