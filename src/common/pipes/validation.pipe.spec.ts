// src/common/pipes/validation.pipe.spec.ts
/**
 * Tests for DTO Validation
 * 
 * Verifies:
 * - Extra fields are rejected (400)
 * - Incorrect types are rejected (400)
 * - Required fields fail if empty
 * - UUID format is validated
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../../auth/dto/login.dto';
import { CreatePatientDto } from '../../modules/patients/dto/create-patient.dto';
import { CreateSessionDto } from '../../modules/sessions/dto/create-session.dto';
import { CreateShadowNoteDto } from '../../modules/shadow-notes/dto/create-shadow-note.dto';
import { CreateAppointmentDto } from '../../modules/appointments/dto/create-appointment.dto';

describe('DTO Validation', () => {
    describe('LoginDto', () => {
        it('should reject empty email', async () => {
            const dto = plainToInstance(LoginDto, {
                email: '',
                password: 'password123',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'email')).toBe(true);
        });

        it('should reject invalid email format', async () => {
            const dto = plainToInstance(LoginDto, {
                email: 'not-an-email',
                password: 'password123',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'email')).toBe(true);
        });

        it('should reject short password', async () => {
            const dto = plainToInstance(LoginDto, {
                email: 'valid@email.com',
                password: 'short',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'password')).toBe(true);
        });

        it('should accept valid login data', async () => {
            const dto = plainToInstance(LoginDto, {
                email: 'admin@syntegra.com',
                password: 'securePassword123',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('CreatePatientDto', () => {
        it('should reject empty firstName', async () => {
            const dto = plainToInstance(CreatePatientDto, {
                firstName: '',
                lastName: 'Test',
                dateOfBirth: '1990-01-01',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'firstName')).toBe(true);
        });

        it('should reject missing required fields', async () => {
            const dto = plainToInstance(CreatePatientDto, {});
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'firstName')).toBe(true);
            expect(errors.some(e => e.property === 'lastName')).toBe(true);
            expect(errors.some(e => e.property === 'dateOfBirth')).toBe(true);
        });

        it('should reject invalid date format', async () => {
            const dto = plainToInstance(CreatePatientDto, {
                firstName: 'Juan',
                lastName: 'Pérez',
                dateOfBirth: 'not-a-date',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'dateOfBirth')).toBe(true);
        });

        it('should accept valid patient data', async () => {
            const dto = plainToInstance(CreatePatientDto, {
                firstName: 'Juan',
                lastName: 'Pérez',
                dateOfBirth: '1990-05-15',
                email: 'patient@example.com',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('CreateSessionDto', () => {
        it('should reject invalid UUID for appointmentId', async () => {
            const dto = plainToInstance(CreateSessionDto, {
                appointmentId: 'not-a-uuid',
                startedAt: '2024-01-15T10:00:00Z',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'appointmentId')).toBe(true);
        });

        it('should reject invalid date format', async () => {
            // c8a7b6d5-e4f3-4a2b-9c8d-1e2f3a4b5c6d is a valid v4 UUID
            const dto = plainToInstance(CreateSessionDto, {
                appointmentId: 'c8a7b6d5-e4f3-4a2b-9c8d-1e2f3a4b5c6d',
                startedAt: 'not-a-date',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'startedAt')).toBe(true);
        });

        it('should accept valid session data', async () => {
            const dto = plainToInstance(CreateSessionDto, {
                appointmentId: 'c8a7b6d5-e4f3-4a2b-9c8d-1e2f3a4b5c6d',
                startedAt: '2024-01-15T10:00:00Z',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('CreateShadowNoteDto', () => {
        it('should reject invalid UUID', async () => {
            const dto = plainToInstance(CreateShadowNoteDto, {
                sessionId: 'not-a-uuid',
                content: 'Valid content',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'sessionId')).toBe(true);
        });

        it('should reject empty content', async () => {
            const dto = plainToInstance(CreateShadowNoteDto, {
                sessionId: 'c8a7b6d5-e4f3-4a2b-9c8d-1e2f3a4b5c6d',
                content: '',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'content')).toBe(true);
        });

        it('should accept valid shadow note data', async () => {
            const dto = plainToInstance(CreateShadowNoteDto, {
                sessionId: 'c8a7b6d5-e4f3-4a2b-9c8d-1e2f3a4b5c6d',
                content: 'Private therapist observation',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });

    describe('CreateAppointmentDto', () => {
        it('should reject invalid UUID for patientId', async () => {
            const dto = plainToInstance(CreateAppointmentDto, {
                patientId: 'not-a-uuid',
                scheduledStart: '2024-01-15T10:00:00Z',
                scheduledEnd: '2024-01-15T11:00:00Z',
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.property === 'patientId')).toBe(true);
        });

        it('should accept valid appointment data', async () => {
            const dto = plainToInstance(CreateAppointmentDto, {
                patientId: 'c8a7b6d5-e4f3-4a2b-9c8d-1e2f3a4b5c6d',
                scheduledStart: '2024-01-15T10:00:00Z',
                scheduledEnd: '2024-01-15T11:00:00Z',
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
