// =============================================================================
// CLINICAL HISTORY FORM
// Historia Clínica Psicológica completa — 6 secciones
// Modo: crear / editar / ver
// =============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { clinicalHistoryApi, patientsApi } from '../api';
import { Spinner, Card, Button, ErrorMessage } from '../components';
import type {
    Patient,
    ClinicalHistory,
    CHIdentification,
    CHConsultation,
    CHAntecedents,
    CHMentalExam,
    CHDiagnosticImpression,
    CHTreatmentPlan,
    CHSubstance,
} from '../types';
import styles from './ClinicalHistoryForm.module.css';

type Mode = 'create' | 'edit' | 'view';

export default function ClinicalHistoryForm() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [mode, setMode] = useState<Mode>('create');
    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<ClinicalHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // === FORM STATE ===
    const [identification, setIdentification] = useState<CHIdentification>({});
    const [consultation, setConsultation] = useState<CHConsultation>({});
    const [antecedents, setAntecedents] = useState<CHAntecedents>({
        personalPathological: { substances: [{ substance: '', frequency: '', amount: '' }] },
    });
    const [mentalExam, setMentalExam] = useState<CHMentalExam>({});
    const [diagnosticImpression, setDiagnosticImpression] = useState<CHDiagnosticImpression>({});
    const [treatmentPlan, setTreatmentPlan] = useState<CHTreatmentPlan>({ objectives: ['', ''] });

    // Load patient and existing history
    useEffect(() => {
        if (!patientId) return;
        (async () => {
            try {
                setIsLoading(true);
                const [p, h] = await Promise.all([
                    patientsApi.getPatientById(patientId),
                    clinicalHistoryApi.getClinicalHistory(patientId),
                ]);
                setPatient(p);
                if (h) {
                    setHistory(h);
                    setMode('view');
                    // Populate form from existing data
                    if (h.identification) setIdentification(h.identification);
                    if (h.consultation) setConsultation(h.consultation);
                    if (h.antecedents) setAntecedents(h.antecedents);
                    if (h.mentalExam) setMentalExam(h.mentalExam);
                    if (h.diagnosticImpression) setDiagnosticImpression(h.diagnosticImpression);
                    if (h.treatmentPlan) setTreatmentPlan(h.treatmentPlan);
                }
            } catch {
                setError('Error al cargar datos del paciente');
            } finally {
                setIsLoading(false);
            }
        })();
    }, [patientId]);

    // Pre-fill identification from patient data
    useEffect(() => {
        if (patient && mode === 'create') {
            setIdentification(prev => ({
                ...prev,
                address: patient.address ?? prev.address,
                phone: patient.contactPhone ?? prev.phone,
                emergencyContact: patient.emergencyContactName
                    ? `${patient.emergencyContactName} - ${patient.emergencyPhone ?? ''}`
                    : prev.emergencyContact,
            }));
        }
    }, [patient, mode]);

    const isEditable = mode === 'create' || mode === 'edit';

    // === SAVE ===
    async function handleSave() {
        if (!patientId) return;
        setIsSaving(true);
        setError('');
        setSaveSuccess(false);

        try {
            const payload = {
                identification,
                consultation,
                antecedents,
                mentalExam,
                diagnosticImpression,
                treatmentPlan,
            };

            if (mode === 'create') {
                const created = await clinicalHistoryApi.createClinicalHistory({
                    patientId,
                    ...payload,
                });
                setHistory(created);
                setMode('view');
            } else if (mode === 'edit' && history) {
                const updated = await clinicalHistoryApi.updateClinicalHistory(history.id, payload);
                setHistory(updated);
                setMode('view');
            }
            setSaveSuccess(true);
            setShowConfirm(false);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err: any) {
            setError(err?.message || 'Error al guardar');
        } finally {
            setIsSaving(false);
        }
    }

    function handleEditClick() {
        setMode('edit');
        setSaveSuccess(false);
    }

    function handleCancelEdit() {
        if (!history) return;
        // Revert form to saved data
        if (history.identification) setIdentification(history.identification);
        if (history.consultation) setConsultation(history.consultation);
        if (history.antecedents) setAntecedents(history.antecedents);
        if (history.mentalExam) setMentalExam(history.mentalExam);
        if (history.diagnosticImpression) setDiagnosticImpression(history.diagnosticImpression);
        if (history.treatmentPlan) setTreatmentPlan(history.treatmentPlan);
        setMode('view');
    }

    // Substance helpers
    function updateSubstance(index: number, field: keyof CHSubstance, value: string) {
        const subs = [...(antecedents.personalPathological?.substances ?? [])];
        subs[index] = { ...subs[index], [field]: value };
        setAntecedents({
            ...antecedents,
            personalPathological: { ...antecedents.personalPathological, substances: subs },
        });
    }

    function addSubstance() {
        const subs = [...(antecedents.personalPathological?.substances ?? [])];
        subs.push({ substance: '', frequency: '', amount: '' });
        setAntecedents({
            ...antecedents,
            personalPathological: { ...antecedents.personalPathological, substances: subs },
        });
    }

    // Objective helpers
    function updateObjective(index: number, value: string) {
        const objs = [...(treatmentPlan.objectives ?? [])];
        objs[index] = value;
        setTreatmentPlan({ ...treatmentPlan, objectives: objs });
    }

    function addObjective() {
        setTreatmentPlan({
            ...treatmentPlan,
            objectives: [...(treatmentPlan.objectives ?? []), ''],
        });
    }

    // Orientation toggle
    function toggleOrientation(item: string) {
        const current = mentalExam.orientation ?? [];
        const updated = current.includes(item)
            ? current.filter(o => o !== item)
            : [...current, item];
        setMentalExam({ ...mentalExam, orientation: updated });
    }

    // === LOADING ===
    if (isLoading) {
        return (
            <div className="page">
                <div className="container">
                    <div className={styles.loadingContainer}>
                        <Spinner size="lg" />
                        <p>Cargando historia clínica...</p>
                    </div>
                </div>
            </div>
        );
    }

    // === RENDER ===
    return (
        <div className="page animate-fade-in">
            <div className="container">
                {/* Header */}
                <header className={styles.header}>
                    <div>
                        <h1 className="page-title">
                            Historia Clínica Psicológica
                        </h1>
                        {patient && (
                            <p className={styles.subtitle}>
                                Paciente: {patient.firstName} {patient.lastName}
                                {patient.externalId && ` — Exp. ${patient.externalId}`}
                            </p>
                        )}
                        <p className={styles.confidential}>CONFIDENCIAL</p>
                    </div>
                    <div className={styles.headerActions}>
                        {mode === 'view' && (
                            <Button onClick={handleEditClick}>✏️ Editar</Button>
                        )}
                        {mode === 'edit' && (
                            <Button onClick={handleCancelEdit} variant="ghost">Cancelar</Button>
                        )}
                    </div>
                </header>

                {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
                {saveSuccess && (
                    <div className={styles.successMessage}>✅ Historia clínica guardada correctamente</div>
                )}

                {/* Metadata */}
                {history && mode === 'view' && (
                    <Card className={styles.metaCard}>
                        <div className={styles.metaGrid}>
                            <div><strong>Fecha de Apertura:</strong> {new Date(history.openedAt).toLocaleDateString('es-MX')}</div>
                            <div><strong>No. de Expediente:</strong> {patient?.externalId ?? '—'}</div>
                            <div>
                                <strong>Psicólogo Tratante:</strong>{' '}
                                {history.therapist
                                    ? `${history.therapist.firstName} ${history.therapist.lastName}`
                                    : '—'}
                            </div>
                            <div>
                                <strong>Cédula Prof:</strong>{' '}
                                {history.therapist?.licenseNumber ?? '—'}
                            </div>
                        </div>
                    </Card>
                )}

                {/* ============= SECTION I: FICHA DE IDENTIFICACIÓN ============= */}
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>I. Ficha de Identificación</h2>
                    <p className={styles.sectionHint}>Datos sociodemográficos básicos para situar al paciente.</p>

                    <div className={styles.formGrid}>
                        <div className="form-group">
                            <label className="form-label">Nombre Completo</label>
                            <input className="form-input" value={patient ? `${patient.firstName} ${patient.lastName}` : ''} disabled />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fecha de Nacimiento</label>
                            <input className="form-input" value={patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('es-MX') : ''} disabled />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lugar de Nacimiento</label>
                            <input className="form-input" value={identification.birthPlace ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, birthPlace: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estado Civil</label>
                            <select className="form-input" value={identification.maritalStatus ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, maritalStatus: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Soltero">Soltero(a)</option>
                                <option value="Casado">Casado(a)</option>
                                <option value="Divorciado">Divorciado(a)</option>
                                <option value="Viudo">Viudo(a)</option>
                                <option value="Unión Libre">Unión Libre</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Escolaridad</label>
                            <input className="form-input" value={identification.education ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, education: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Ocupación</label>
                            <input className="form-input" value={identification.occupation ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, occupation: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Domicilio</label>
                            <input className="form-input" value={identification.address ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, address: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Teléfono de Contacto</label>
                            <input className="form-input" value={identification.phone ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Contacto de Emergencia (Nombre y Tel)</label>
                            <input className="form-input" value={identification.emergencyContact ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, emergencyContact: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">¿Quién refiere?</label>
                            <select className="form-input" value={identification.referralSource ?? ''} disabled={!isEditable}
                                onChange={e => setIdentification({ ...identification, referralSource: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Iniciativa propia">Iniciativa propia</option>
                                <option value="Médico">Médico</option>
                                <option value="Familiar">Familiar</option>
                                <option value="Institución">Institución</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* ============= SECTION II: MOTIVO DE CONSULTA ============= */}
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>II. Motivo de Consulta</h2>
                    <p className={styles.sectionHint}>Registrar textualmente lo que dice el paciente ("entre comillas") y luego la interpretación técnica.</p>

                    <div className="form-group">
                        <label className="form-label">Lo que refiere el paciente (textual, entre comillas)</label>
                        <textarea className="form-input" rows={4} value={consultation.patientStatement ?? ''} disabled={!isEditable}
                            placeholder='Ej: "Me siento muy ansioso y no puedo dormir desde hace dos semanas."'
                            onChange={e => setConsultation({ ...consultation, patientStatement: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Inicio y curso del padecimiento</label>
                        <textarea className="form-input" rows={3} value={consultation.onsetAndCourse ?? ''} disabled={!isEditable}
                            placeholder="¿Cuándo empezó? ¿Ha empeorado? ¿Con qué frecuencia ocurre?"
                            onChange={e => setConsultation({ ...consultation, onsetAndCourse: e.target.value })} />
                    </div>
                </Card>

                {/* ============= SECTION III: ANTECEDENTES ============= */}
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>III. Antecedentes (Anamnesis)</h2>

                    <h3 className={styles.subsectionTitle}>1. Antecedentes Personales Patológicos</h3>
                    <div className={styles.formGrid}>
                        <div className="form-group">
                            <label className="form-label">Enfermedades crónicas</label>
                            <input className="form-input" value={antecedents.personalPathological?.chronicDiseases ?? ''} disabled={!isEditable}
                                onChange={e => setAntecedents({
                                    ...antecedents,
                                    personalPathological: { ...antecedents.personalPathological, chronicDiseases: e.target.value },
                                })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Medicamentos actuales</label>
                            <input className="form-input" value={antecedents.personalPathological?.currentMedications ?? ''} disabled={!isEditable}
                                onChange={e => setAntecedents({
                                    ...antecedents,
                                    personalPathological: { ...antecedents.personalPathological, currentMedications: e.target.value },
                                })} />
                        </div>
                    </div>

                    <label className="form-label" style={{ marginTop: 'var(--spacing-md)' }}>Consumo de sustancias</label>
                    {(antecedents.personalPathological?.substances ?? []).map((sub, i) => (
                        <div key={i} className={styles.substanceRow}>
                            <input className="form-input" placeholder="Sustancia" value={sub.substance ?? ''} disabled={!isEditable}
                                onChange={e => updateSubstance(i, 'substance', e.target.value)} />
                            <input className="form-input" placeholder="Frecuencia" value={sub.frequency ?? ''} disabled={!isEditable}
                                onChange={e => updateSubstance(i, 'frequency', e.target.value)} />
                            <input className="form-input" placeholder="Cantidad" value={sub.amount ?? ''} disabled={!isEditable}
                                onChange={e => updateSubstance(i, 'amount', e.target.value)} />
                        </div>
                    ))}
                    {isEditable && (
                        <Button variant="ghost" onClick={addSubstance}>+ Agregar sustancia</Button>
                    )}

                    <div className={styles.formGrid} style={{ marginTop: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">¿Tratamientos psicológicos/psiquiátricos previos?</label>
                            <select className="form-input" disabled={!isEditable}
                                value={antecedents.personalPathological?.previousTreatments === true ? 'si' : antecedents.personalPathological?.previousTreatments === false ? 'no' : ''}
                                onChange={e => setAntecedents({
                                    ...antecedents,
                                    personalPathological: { ...antecedents.personalPathological, previousTreatments: e.target.value === 'si' },
                                })}>
                                <option value="">Seleccionar</option>
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Detalles</label>
                            <input className="form-input" value={antecedents.personalPathological?.previousTreatmentsDetails ?? ''} disabled={!isEditable}
                                onChange={e => setAntecedents({
                                    ...antecedents,
                                    personalPathological: { ...antecedents.personalPathological, previousTreatmentsDetails: e.target.value },
                                })} />
                        </div>
                    </div>

                    <h3 className={styles.subsectionTitle}>2. Antecedentes Heredo-Familiares</h3>
                    <div className="form-group">
                        <label className="form-label">¿Diagnósticos mentales en la familia? (Depresión, Esquizofrenia, Suicidios, Adicciones)</label>
                        <textarea className="form-input" rows={3} value={antecedents.hereditaryFamily ?? ''} disabled={!isEditable}
                            onChange={e => setAntecedents({ ...antecedents, hereditaryFamily: e.target.value })} />
                    </div>

                    <h3 className={styles.subsectionTitle}>3. Historia Familiar y Dinámica (Genograma)</h3>
                    <div className="form-group">
                        <label className="form-label">Relación con padres, hermanos, pareja e hijos</label>
                        <textarea className="form-input" rows={3} value={antecedents.familyDynamics ?? ''} disabled={!isEditable}
                            onChange={e => setAntecedents({ ...antecedents, familyDynamics: e.target.value })} />
                    </div>
                </Card>

                {/* ============= SECTION IV: EXAMEN MENTAL ============= */}
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>IV. Examen Mental (Observación Clínica)</h2>
                    <p className={styles.sectionHint}>Estado del paciente durante la entrevista.</p>

                    <div className={styles.formGrid}>
                        <div className="form-group">
                            <label className="form-label">Apariencia</label>
                            <select className="form-input" value={mentalExam.appearance ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, appearance: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Aliñado">Aliñado</option>
                                <option value="Desaliñado">Desaliñado</option>
                                <option value="Acorde a edad/contexto">Acorde a edad/contexto</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Conciencia</label>
                            <select className="form-input" value={mentalExam.consciousness ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, consciousness: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Alerta">Alerta</option>
                                <option value="Somnoliento">Somnoliento</option>
                                <option value="Confuso">Confuso</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Orientación</label>
                            <div className={styles.checkboxGroup}>
                                {['Tiempo', 'Lugar', 'Persona'].map(item => (
                                    <label key={item} className={styles.checkboxLabel}>
                                        <input type="checkbox" disabled={!isEditable}
                                            checked={(mentalExam.orientation ?? []).includes(item)}
                                            onChange={() => toggleOrientation(item)} />
                                        {item}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Lenguaje</label>
                            <select className="form-input" value={mentalExam.language ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, language: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Coherente">Coherente</option>
                                <option value="Verborreico">Verborreico</option>
                                <option value="Bloqueos">Bloqueos</option>
                                <option value="Tartamudeo">Tartamudeo</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Memoria</label>
                            <select className="form-input" value={mentalExam.memory ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, memory: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Conservada">Conservada</option>
                                <option value="Fallas corto plazo">Fallas corto plazo</option>
                                <option value="Fallas largo plazo">Fallas largo plazo</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Estado de Ánimo (Afecto)</label>
                            <select className="form-input" value={mentalExam.mood ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, mood: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Eutímico (Normal)">Eutímico (Normal)</option>
                                <option value="Depresivo">Depresivo</option>
                                <option value="Ansioso">Ansioso</option>
                                <option value="Irritable">Irritable</option>
                                <option value="Lábil (Cambiante)">Lábil (Cambiante)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pensamiento</label>
                            <select className="form-input" value={mentalExam.thinking ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, thinking: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Lógico">Lógico</option>
                                <option value="Ideas delirantes">Ideas delirantes</option>
                                <option value="Obsesivo">Obsesivo</option>
                                <option value="Ideación suicida">Ideación suicida</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Juicio de Realidad</label>
                            <select className="form-input" value={mentalExam.judgmentOfReality ?? ''} disabled={!isEditable}
                                onChange={e => setMentalExam({ ...mentalExam, judgmentOfReality: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Conservado">Conservado</option>
                                <option value="Alterado">Alterado</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* ============= SECTION V: IMPRESIÓN DIAGNÓSTICA ============= */}
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>V. Impresión Diagnóstica</h2>
                    <p className={styles.sectionHint}>Basado en DSM-5 o CIE-10. En primera sesión: "Diagnóstico Presuntivo".</p>

                    <div className="form-group">
                        <label className="form-label">Hipótesis Diagnóstica</label>
                        <textarea className="form-input" rows={3} value={diagnosticImpression.hypothesis ?? ''} disabled={!isEditable}
                            onChange={e => setDiagnosticImpression({ ...diagnosticImpression, hypothesis: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Código (CIE-10 / DSM-5)</label>
                        <input className="form-input" value={diagnosticImpression.diagnosticCode ?? ''} disabled={!isEditable}
                            placeholder="Ej: F41.1"
                            onChange={e => setDiagnosticImpression({ ...diagnosticImpression, diagnosticCode: e.target.value })} />
                    </div>
                </Card>

                {/* ============= SECTION VI: PLAN DE TRATAMIENTO ============= */}
                <Card className={styles.section}>
                    <h2 className={styles.sectionTitle}>VI. Plan de Tratamiento</h2>

                    <label className="form-label">Objetivos Terapéuticos</label>
                    {(treatmentPlan.objectives ?? []).map((obj, i) => (
                        <div key={i} className="form-group">
                            <input className="form-input" placeholder={`Objetivo ${i + 1}`} value={obj} disabled={!isEditable}
                                onChange={e => updateObjective(i, e.target.value)} />
                        </div>
                    ))}
                    {isEditable && (
                        <Button variant="ghost" onClick={addObjective}>+ Agregar objetivo</Button>
                    )}

                    <div className={styles.formGrid} style={{ marginTop: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Modalidad</label>
                            <select className="form-input" value={treatmentPlan.modality ?? ''} disabled={!isEditable}
                                onChange={e => setTreatmentPlan({ ...treatmentPlan, modality: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Terapia Cognitivo-Conductual">Terapia Cognitivo-Conductual</option>
                                <option value="Psicoanalítica">Psicoanalítica</option>
                                <option value="Sistémica">Sistémica</option>
                                <option value="Humanista">Humanista</option>
                                <option value="Integrativa">Integrativa</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Frecuencia sugerida</label>
                            <select className="form-input" value={treatmentPlan.frequency ?? ''} disabled={!isEditable}
                                onChange={e => setTreatmentPlan({ ...treatmentPlan, frequency: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Semanal">Semanal</option>
                                <option value="Quincenal">Quincenal</option>
                                <option value="Mensual">Mensual</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pronóstico</label>
                            <select className="form-input" value={treatmentPlan.prognosis ?? ''} disabled={!isEditable}
                                onChange={e => setTreatmentPlan({ ...treatmentPlan, prognosis: e.target.value })}>
                                <option value="">Seleccionar</option>
                                <option value="Favorable">Favorable</option>
                                <option value="Reservado">Reservado</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {/* ============= THERAPIST SIGNATURE (view mode) ============= */}
                {mode === 'view' && history && (
                    <Card className={styles.section}>
                        <div className={styles.signatureBlock}>
                            <p>
                                <strong>Psicólogo Tratante:</strong>{' '}
                                {history.therapist
                                    ? `${history.therapist.firstName} ${history.therapist.lastName}`
                                    : user ? `${user.firstName} ${user.lastName}` : '—'}
                            </p>
                            <p>
                                <strong>Cédula Profesional No.:</strong>{' '}
                                {history.therapist?.licenseNumber ?? '—'}
                            </p>
                        </div>
                    </Card>
                )}

                {/* ============= ACTIONS ============= */}
                <div className={styles.actions}>
                    {isEditable && (
                        <>
                            {mode === 'edit' ? (
                                <Button onClick={() => setShowConfirm(true)} isLoading={isSaving}>
                                    💾 Guardar Cambios
                                </Button>
                            ) : (
                                <Button onClick={handleSave} isLoading={isSaving}>
                                    💾 Guardar Historia Clínica
                                </Button>
                            )}
                        </>
                    )}
                    <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)}>
                        ← Volver al Paciente
                    </Button>
                </div>

                {/* Confirm Modal */}
                {showConfirm && (
                    <div className={styles.modalOverlay}>
                        <Card className={styles.modal}>
                            <h3>Confirmar Edición</h3>
                            <p>¿Estás seguro de que deseas actualizar la Historia Clínica de este paciente?</p>
                            <p className={styles.modalHint}>
                                Los cambios se guardarán y quedarán registrados en la auditoría.
                            </p>
                            <div className={styles.modalActions}>
                                <Button onClick={handleSave} isLoading={isSaving}>
                                    Sí, Guardar
                                </Button>
                                <Button variant="ghost" onClick={() => setShowConfirm(false)} disabled={isSaving}>
                                    Cancelar
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
