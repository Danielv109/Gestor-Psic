// =============================================================================
// SPINNER COMPONENT
// Loading indicator - no business logic
// =============================================================================

import styles from './Spinner.module.css';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
    return <div className={`${styles.spinner} ${styles[size]}`} />;
}
