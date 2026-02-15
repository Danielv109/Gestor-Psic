// src/test/test-utils.ts
import { GlobalRole, ContextualRole, AuditAction, AuditResource } from '@prisma/client';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ClinicalNarrative, KeyPurpose } from '../crypto/interfaces/crypto.interfaces';

// =============================================================================
// MOCK AUTHENTICATED USERS
// =============================================================================

export const mockTerapeuta = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    id: 'terapeuta-uuid-001',
    email: 'dr.garcia@syntegra.com',
    globalRole: GlobalRole.TERAPEUTA,
    firstName: 'María',
    lastName: 'García',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});

export const mockSupervisor = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    id: 'supervisor-uuid-001',
    email: 'supervisor@syntegra.com',
    globalRole: GlobalRole.SUPERVISOR,
    firstName: 'Carlos',
    lastName: 'Martínez',
    ip: '192.168.1.101',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});

export const mockAuditor = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    id: 'auditor-uuid-001',
    email: 'auditor@syntegra.com',
    globalRole: GlobalRole.AUDITOR,
    firstName: 'Ana',
    lastName: 'López',
    ip: '192.168.1.102',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});

export const mockAsistente = (overrides?: Partial<AuthenticatedUser>): AuthenticatedUser => ({
    id: 'asistente-uuid-001',
    email: 'asistente@syntegra.com',
    globalRole: GlobalRole.ASISTENTE,
    firstName: 'Pedro',
    lastName: 'Sánchez',
    ip: '192.168.1.103',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});

// =============================================================================
// MOCK ENTITIES
// =============================================================================

export const mockPatient = (overrides?: Partial<any>) => ({
    id: 'patient-uuid-001',
    externalId: 'PAT-20260203-A1B2',
    firstName: 'Juan',
    lastName: 'Pérez',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'M',
    contactEmail: 'juan.perez@email.com',
    contactPhone: '+52 555 123 4567',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const mockAppointment = (overrides?: Partial<any>) => ({
    id: 'appointment-uuid-001',
    patientId: 'patient-uuid-001',
    therapistId: 'terapeuta-uuid-001',
    scheduledStart: new Date(),
    scheduledEnd: new Date(Date.now() + 3600000),
    status: 'SCHEDULED',
    sessionType: 'INDIVIDUAL',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const mockClinicalSession = (overrides?: Partial<any>) => ({
    id: 'session-uuid-001',
    appointmentId: 'appointment-uuid-001',
    patientId: 'patient-uuid-001',
    therapistId: 'terapeuta-uuid-001',
    startedAt: new Date(),
    endedAt: null,
    durationMinutes: null,
    clinicalNarrativeEncrypted: null,
    narrativeIV: null,
    narrativeKeyId: null,
    signedAt: null,
    signatureHash: null,
    isDraft: true,
    isLocked: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const mockSignedSession = (overrides?: Partial<any>) => ({
    ...mockClinicalSession(),
    signedAt: new Date(),
    signatureHash: 'abc123def456789012345678901234567890abcdef12',
    isDraft: false,
    isLocked: true,
    ...overrides,
});

export const mockShadowNote = (overrides?: Partial<any>) => ({
    id: 'shadow-note-uuid-001',
    sessionId: 'session-uuid-001',
    therapistId: 'terapeuta-uuid-001',
    contentEncrypted: Buffer.from('encrypted-content'),
    contentIV: Buffer.from('0123456789abcdef'),
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const mockClinicalNarrative = (): ClinicalNarrative => ({
    subjectiveReport: 'Paciente reporta ansiedad moderada durante la semana.',
    objectiveObservation: 'Presenta inquietud motora y dificultad para mantener contacto visual.',
    assessment: 'Trastorno de ansiedad generalizada en evolución favorable.',
    plan: 'Continuar terapia cognitivo-conductual. Próxima cita en 1 semana.',
    additionalNotes: 'Paciente mostró mejoría en técnicas de respiración.',
});

export const mockCollaboration = (overrides?: Partial<any>) => ({
    id: 'collaboration-uuid-001',
    patientId: 'patient-uuid-001',
    userId: 'terapeuta-uuid-001',
    contextualRole: ContextualRole.TERAPEUTA_TITULAR,
    startDate: new Date(),
    endDate: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const mockEncryptionKey = (overrides?: Partial<any>) => ({
    id: 'key-uuid-001',
    purpose: KeyPurpose.CLINICAL_NOTES,
    version: 1,
    algorithm: 'AES-256-GCM',
    isActive: true,
    activatedAt: new Date(),
    rotatedAt: null,
    expiresAt: null,
    vaultKeyPath: 'vault://syntegra/keys/CLINICAL_NOTES/v1',
    createdAt: new Date(),
    ...overrides,
});

// =============================================================================
// MOCK SERVICES
// =============================================================================

export const mockPrismaService = () => ({
    auditLog: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
    },
    encryptionKey: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data) => Promise.resolve({
            id: 'new-key-uuid',
            ...data.data,
            createdAt: new Date(),
        })),
        update: jest.fn().mockResolvedValue({}),
    },
    patient: {
        create: jest.fn().mockResolvedValue(mockPatient()),
        findUnique: jest.fn().mockResolvedValue(mockPatient()),
        findMany: jest.fn().mockResolvedValue([mockPatient()]),
        update: jest.fn().mockResolvedValue(mockPatient()),
    },
    clinicalSession: {
        create: jest.fn().mockResolvedValue(mockClinicalSession()),
        findUnique: jest.fn().mockResolvedValue(mockClinicalSession()),
        update: jest.fn().mockResolvedValue(mockClinicalSession()),
    },
    shadowNote: {
        create: jest.fn().mockResolvedValue(mockShadowNote()),
        findUnique: jest.fn().mockResolvedValue(mockShadowNote()),
        update: jest.fn().mockResolvedValue(mockShadowNote()),
    },
});

export const mockAuditService = () => ({
    log: jest.fn().mockResolvedValue(undefined),
    logAccessDenied: jest.fn().mockResolvedValue(undefined),
    findByPatient: jest.fn().mockResolvedValue([]),
    findByActor: jest.fn().mockResolvedValue([]),
});

export const mockCryptoService = () => ({
    encryptClinicalNarrative: jest.fn().mockResolvedValue({
        encrypted: Buffer.from('encrypted-narrative'),
        iv: Buffer.from('0123456789abcdef'),
        keyId: 'key-uuid-001',
    }),
    decryptClinicalNarrative: jest.fn().mockResolvedValue(mockClinicalNarrative()),
    encryptShadowNote: jest.fn().mockResolvedValue({
        encrypted: Buffer.from('encrypted-shadow-note'),
        iv: Buffer.from('0123456789abcdef'),
    }),
    decryptShadowNote: jest.fn().mockResolvedValue('Decrypted shadow note content'),
    generateSessionSignature: jest.fn().mockReturnValue('signature-hash-abc123'),
    generateHash: jest.fn().mockReturnValue('hash-abc123'),
    reEncryptClinicalNarrative: jest.fn().mockResolvedValue({
        encrypted: Buffer.from('re-encrypted-narrative'),
        iv: Buffer.from('abcdef0123456789'),
        keyId: 'key-uuid-002',
    }),
    verifyPayloadIntegrity: jest.fn().mockReturnValue(true),
});

export const mockKeyManagementService = () => ({
    getActiveKey: jest.fn().mockResolvedValue({
        keyId: 'key-uuid-001',
        purpose: KeyPurpose.CLINICAL_NOTES,
        version: 1,
        algorithm: 'AES-256-GCM',
        isActive: true,
        createdAt: new Date(),
    }),
    getKeyById: jest.fn().mockResolvedValue(Buffer.alloc(32, 0)),
    createKey: jest.fn().mockResolvedValue({
        keyId: 'new-key-uuid',
        purpose: KeyPurpose.CLINICAL_NOTES,
        version: 2,
        algorithm: 'AES-256-GCM',
        isActive: true,
        createdAt: new Date(),
    }),
    rotateKey: jest.fn().mockResolvedValue({
        oldKey: { keyId: 'key-uuid-001', version: 1, isActive: false },
        newKey: { keyId: 'key-uuid-002', version: 2, isActive: true },
    }),
    deriveUserPersonalKey: jest.fn().mockReturnValue(Buffer.alloc(32, 1)),
    validateKeyForDecryption: jest.fn().mockResolvedValue(undefined),
    getKeyMetadata: jest.fn().mockReturnValue(undefined),
    listKeys: jest.fn().mockResolvedValue([]),
});

// =============================================================================
// MOCK REPOSITORIES
// =============================================================================

export const mockSessionsRepository = () => ({
    create: jest.fn().mockResolvedValue(mockClinicalSession()),
    findById: jest.fn().mockResolvedValue(mockClinicalSession()),
    findByAppointment: jest.fn().mockResolvedValue(null),
    findByTherapist: jest.fn().mockResolvedValue([mockClinicalSession()]),
    findByPatient: jest.fn().mockResolvedValue([mockClinicalSession()]),
    update: jest.fn().mockResolvedValue(mockClinicalSession()),
    sign: jest.fn().mockResolvedValue(mockSignedSession()),
    getVersionCount: jest.fn().mockResolvedValue(0),
    createVersion: jest.fn().mockResolvedValue({}),
    getVersions: jest.fn().mockResolvedValue([]),
});

export const mockAppointmentsRepository = () => ({
    findById: jest.fn().mockResolvedValue(mockAppointment()),
    update: jest.fn().mockResolvedValue(mockAppointment()),
});

export const mockShadowNotesRepository = () => ({
    create: jest.fn().mockResolvedValue(mockShadowNote()),
    findById: jest.fn().mockResolvedValue(mockShadowNote()),
    findBySession: jest.fn().mockResolvedValue(null),
    findByTherapist: jest.fn().mockResolvedValue([mockShadowNote()]),
    existsForSession: jest.fn().mockResolvedValue(false),
    update: jest.fn().mockResolvedValue(mockShadowNote()),
    softDelete: jest.fn().mockResolvedValue(mockShadowNote({ deletedAt: new Date() })),
});

export const mockPatientsRepository = () => ({
    create: jest.fn().mockResolvedValue(mockPatient()),
    findById: jest.fn().mockResolvedValue(mockPatient()),
    findByTherapist: jest.fn().mockResolvedValue([mockPatient()]),
    findWithCollaborations: jest.fn().mockResolvedValue(mockPatient()),
    update: jest.fn().mockResolvedValue(mockPatient()),
    softDelete: jest.fn().mockResolvedValue(mockPatient({ deletedAt: new Date() })),
});

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Crear buffer de IV válido para tests
 */
export const createMockIV = (): Buffer => Buffer.from('0123456789abcdef');

/**
 * Crear buffer de datos cifrados con authTag para tests
 */
export const createMockEncryptedData = (): Buffer => {
    const ciphertext = Buffer.alloc(50, 0);
    const authTag = Buffer.alloc(16, 1);
    return Buffer.concat([ciphertext, authTag]);
};

/**
 * Esperar a que Jest procese promises pendientes
 */
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));
