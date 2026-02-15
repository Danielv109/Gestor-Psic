// =============================================================================
// GLOBAL SEARCH BAR
// Always-visible patient search with debounce + dropdown results
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { Patient } from '../types';
import styles from './SearchBar.module.css';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const ref = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }

        setLoading(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            try {
                const data = await apiClient<Patient[]>(`/patients/search?q=${encodeURIComponent(query.trim())}`);
                setResults(data);
                setOpen(data.length > 0);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timerRef.current);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleSelect(patient: Patient) {
        setQuery('');
        setOpen(false);
        navigate(`/patients/${patient.id}`);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') {
            setQuery('');
            setOpen(false);
        }
    }

    return (
        <div className={styles.wrapper} ref={ref}>
            <div className={styles.inputWrap}>
                <span className={styles.icon}>🔍</span>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Buscar paciente..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setOpen(true)}
                />
                {loading && <span className={styles.spinner} />}
            </div>

            {open && (
                <div className={styles.dropdown}>
                    {results.map(p => (
                        <button
                            key={p.id}
                            className={styles.result}
                            onClick={() => handleSelect(p)}
                        >
                            <span className={styles.name}>
                                {p.firstName} {p.lastName}
                            </span>
                            <span className={styles.externalId}>
                                {p.externalId}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
