// =============================================================================
// ERROR MESSAGE COMPONENT
// Error display - no business logic
// =============================================================================

import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
    message: string;
    onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
    if (!message) return null;

    return (
        <div className={styles.error}>
            <span>{message}</span>
            {onDismiss && (
                <button onClick={onDismiss} className={styles.dismiss}>×</button>
            )}
        </div>
    );
}
