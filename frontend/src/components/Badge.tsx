// =============================================================================
// BADGE COMPONENT
// Status badge display - no business logic
// =============================================================================

import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'draft' | 'pending' | 'signed' | 'amended' | 'voided' | 'success' | 'error';

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]}`}>
            {children}
        </span>
    );
}
