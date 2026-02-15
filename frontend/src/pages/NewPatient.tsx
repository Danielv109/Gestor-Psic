// =============================================================================
// NEW PATIENT FORM
// Uses useForm hook with backend-first validation
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { useForm } from '../hooks';
import { patientsApi } from '../api';
import { Card, Button, ErrorMessage, FormInput } from '../components';
import type { CreatePatientDto } from '../types';
import styles from './PatientForm.module.css';

// Form values - partial of CreatePatientDto
interface PatientFormValues {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
    isMinor: boolean;
    custodianName: string;
    custodianPhone: string;
}

const initialValues: PatientFormValues = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    isMinor: false,
    custodianName: '',
    custodianPhone: '',
};

export default function NewPatient() {
    const navigate = useNavigate();

    const form = useForm<PatientFormValues>({
        initialValues,
        onSubmit: async (values) => {
            // Build DTO - backend validates all fields
            const dto: CreatePatientDto = {
                firstName: values.firstName,
                lastName: values.lastName,
                dateOfBirth: values.dateOfBirth,
                email: values.email || undefined,
                phone: values.phone || undefined,
                isMinor: values.isMinor,
                custodianName: values.isMinor ? values.custodianName : undefined,
                custodianPhone: values.isMinor ? values.custodianPhone : undefined,
            };
            await patientsApi.createPatient(dto);
        },
        onSuccess: () => {
            navigate('/patients');
        },
    });

    return (
        <div className="page animate-fade-in">
            <div className="container">
                <header className={styles.header}>
                    <h1 className="page-title">Nuevo Paciente</h1>
                </header>

                <Card className={styles.formCard}>
                    {/* Global Error - Not generic! */}
                    {form.globalError && (
                        <ErrorMessage
                            message={form.globalError}
                            onDismiss={() => form.clearErrors()}
                        />
                    )}

                    <form onSubmit={form.handleSubmit}>
                        {/* Required fields - minimal client validation (only required) */}
                        <div className={styles.row}>
                            <FormInput
                                label="Nombre"
                                name="firstName"
                                value={form.values.firstName}
                                onChange={(e) => form.setField('firstName', e.target.value)}
                                error={form.getFieldError('firstName')}
                                disabled={form.isSubmitting}
                                required
                            />
                            <FormInput
                                label="Apellido"
                                name="lastName"
                                value={form.values.lastName}
                                onChange={(e) => form.setField('lastName', e.target.value)}
                                error={form.getFieldError('lastName')}
                                disabled={form.isSubmitting}
                                required
                            />
                        </div>

                        <FormInput
                            label="Fecha de Nacimiento"
                            name="dateOfBirth"
                            type="date"
                            value={form.values.dateOfBirth}
                            onChange={(e) => form.setField('dateOfBirth', e.target.value)}
                            error={form.getFieldError('dateOfBirth')}
                            disabled={form.isSubmitting}
                            required
                        />

                        <div className={styles.row}>
                            <FormInput
                                label="Email"
                                name="email"
                                type="email"
                                value={form.values.email}
                                onChange={(e) => form.setField('email', e.target.value)}
                                error={form.getFieldError('email')}
                                disabled={form.isSubmitting}
                                helpText="Opcional"
                            />
                            <FormInput
                                label="Teléfono"
                                name="phone"
                                type="tel"
                                value={form.values.phone}
                                onChange={(e) => form.setField('phone', e.target.value)}
                                error={form.getFieldError('phone')}
                                disabled={form.isSubmitting}
                                helpText="Opcional"
                            />
                        </div>

                        {/* Minor checkbox */}
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={form.values.isMinor}
                                    onChange={(e) => form.setField('isMinor', e.target.checked)}
                                    disabled={form.isSubmitting}
                                />
                                <span>Es menor de edad</span>
                            </label>
                        </div>

                        {/* Custodian fields - show only if minor */}
                        {form.values.isMinor && (
                            <div className={styles.custodianSection}>
                                <h3>Datos del Tutor</h3>
                                <div className={styles.row}>
                                    <FormInput
                                        label="Nombre del Tutor"
                                        name="custodianName"
                                        value={form.values.custodianName}
                                        onChange={(e) => form.setField('custodianName', e.target.value)}
                                        error={form.getFieldError('custodianName')}
                                        disabled={form.isSubmitting}
                                        required
                                    />
                                    <FormInput
                                        label="Teléfono del Tutor"
                                        name="custodianPhone"
                                        type="tel"
                                        value={form.values.custodianPhone}
                                        onChange={(e) => form.setField('custodianPhone', e.target.value)}
                                        error={form.getFieldError('custodianPhone')}
                                        disabled={form.isSubmitting}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions - Submit disabled while loading */}
                        <div className={styles.actions}>
                            <Button
                                type="submit"
                                isLoading={form.isSubmitting}
                                disabled={form.isSubmitting}
                            >
                                Guardar Paciente
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate('/patients')}
                                disabled={form.isSubmitting}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
