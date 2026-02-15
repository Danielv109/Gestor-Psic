// =============================================================================
// FORM INPUT COMPONENT
// Input with field-level error display
// =============================================================================

import styles from './FormInput.module.css';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Field label */
    label: string;
    /** Field error message */
    error?: string;
    /** Help text */
    helpText?: string;
}

export function FormInput({
    label,
    error,
    helpText,
    id,
    className,
    ...props
}: FormInputProps) {
    const inputId = id || props.name;
    const hasError = !!error;

    return (
        <div className={`${styles.formGroup} ${hasError ? styles.hasError : ''}`}>
            <label htmlFor={inputId} className={styles.label}>
                {label}
                {props.required && <span className={styles.required}>*</span>}
            </label>
            <input
                id={inputId}
                className={`${styles.input} ${className || ''}`}
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
