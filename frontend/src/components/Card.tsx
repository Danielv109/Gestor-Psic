// =============================================================================
// CARD COMPONENT
// Content container - no business logic
// =============================================================================

import styles from './Card.module.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'lg' }: CardProps) {
    return (
        <div className={`${styles.card} ${styles[`padding-${padding}`]} ${className}`}>
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: React.ReactNode;
}

export function CardHeader({ children }: CardHeaderProps) {
    return <div className={styles.header}>{children}</div>;
}

interface CardContentProps {
    children: React.ReactNode;
}

export function CardContent({ children }: CardContentProps) {
    return <div className={styles.content}>{children}</div>;
}
