"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushPromises = exports.createMockEncryptedData = exports.createMockIV = exports.mockPatientsRepository = exports.mockShadowNotesRepository = exports.mockAppointmentsRepository = exports.mockSessionsRepository = exports.mockKeyManagementService = exports.mockCryptoService = exports.mockAuditService = exports.mockPrismaService = exports.mockEncryptionKey = exports.mockCollaboration = exports.mockClinicalNarrative = exports.mockShadowNote = exports.mockSignedSession = exports.mockClinicalSession = exports.mockAppointment = exports.mockPatient = exports.mockAsistente = exports.mockAuditor = exports.mockSupervisor = exports.mockTerapeuta = void 0;
const client_1 = require("@prisma/client");
const crypto_interfaces_1 = require("../crypto/interfaces/crypto.interfaces");
const mockTerapeuta = (overrides) => ({
    id: 'terapeuta-uuid-001',
    email: 'dr.garcia@syntegra.com',
    globalRole: client_1.GlobalRole.TERAPEUTA,
    firstName: 'María',
    lastName: 'García',
    ip: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});
exports.mockTerapeuta = mockTerapeuta;
const mockSupervisor = (overrides) => ({
    id: 'supervisor-uuid-001',
    email: 'supervisor@syntegra.com',
    globalRole: client_1.GlobalRole.SUPERVISOR,
    firstName: 'Carlos',
    lastName: 'Martínez',
    ip: '192.168.1.101',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});
exports.mockSupervisor = mockSupervisor;
const mockAuditor = (overrides) => ({
    id: 'auditor-uuid-001',
    email: 'auditor@syntegra.com',
    globalRole: client_1.GlobalRole.AUDITOR,
    firstName: 'Ana',
    lastName: 'López',
    ip: '192.168.1.102',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});
exports.mockAuditor = mockAuditor;
const mockAsistente = (overrides) => ({
    id: 'asistente-uuid-001',
    email: 'asistente@syntegra.com',
    globalRole: client_1.GlobalRole.ASISTENTE,
    firstName: 'Pedro',
    lastName: 'Sánchez',
    ip: '192.168.1.103',
    userAgent: 'Mozilla/5.0 Test Agent',
    ...overrides,
});
exports.mockAsistente = mockAsistente;
const mockPatient = (overrides) => ({
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
exports.mockPatient = mockPatient;
const mockAppointment = (overrides) => ({
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
exports.mockAppointment = mockAppointment;
const mockClinicalSession = (overrides) => ({
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
exports.mockClinicalSession = mockClinicalSession;
const mockSignedSession = (overrides) => ({
    ...(0, exports.mockClinicalSession)(),
    signedAt: new Date(),
    signatureHash: 'abc123def456789012345678901234567890abcdef12',
    isDraft: false,
    isLocked: true,
    ...overrides,
});
exports.mockSignedSession = mockSignedSession;
const mockShadowNote = (overrides) => ({
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
exports.mockShadowNote = mockShadowNote;
const mockClinicalNarrative = () => ({
    subjectiveReport: 'Paciente reporta ansiedad moderada durante la semana.',
    objectiveObservation: 'Presenta inquietud motora y dificultad para mantener contacto visual.',
    assessment: 'Trastorno de ansiedad generalizada en evolución favorable.',
    plan: 'Continuar terapia cognitivo-conductual. Próxima cita en 1 semana.',
    additionalNotes: 'Paciente mostró mejoría en técnicas de respiración.',
});
exports.mockClinicalNarrative = mockClinicalNarrative;
const mockCollaboration = (overrides) => ({
    id: 'collaboration-uuid-001',
    patientId: 'patient-uuid-001',
    userId: 'terapeuta-uuid-001',
    contextualRole: client_1.ContextualRole.TERAPEUTA_TITULAR,
    startDate: new Date(),
    endDate: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});
exports.mockCollaboration = mockCollaboration;
const mockEncryptionKey = (overrides) => ({
    id: 'key-uuid-001',
    purpose: crypto_interfaces_1.KeyPurpose.CLINICAL_NOTES,
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
exports.mockEncryptionKey = mockEncryptionKey;
const mockPrismaService = () => ({
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
        create: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
        findUnique: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
        findMany: jest.fn().mockResolvedValue([(0, exports.mockPatient)()]),
        update: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
    },
    clinicalSession: {
        create: jest.fn().mockResolvedValue((0, exports.mockClinicalSession)()),
        findUnique: jest.fn().mockResolvedValue((0, exports.mockClinicalSession)()),
        update: jest.fn().mockResolvedValue((0, exports.mockClinicalSession)()),
    },
    shadowNote: {
        create: jest.fn().mockResolvedValue((0, exports.mockShadowNote)()),
        findUnique: jest.fn().mockResolvedValue((0, exports.mockShadowNote)()),
        update: jest.fn().mockResolvedValue((0, exports.mockShadowNote)()),
    },
});
exports.mockPrismaService = mockPrismaService;
const mockAuditService = () => ({
    log: jest.fn().mockResolvedValue(undefined),
    logAccessDenied: jest.fn().mockResolvedValue(undefined),
    findByPatient: jest.fn().mockResolvedValue([]),
    findByActor: jest.fn().mockResolvedValue([]),
});
exports.mockAuditService = mockAuditService;
const mockCryptoService = () => ({
    encryptClinicalNarrative: jest.fn().mockResolvedValue({
        encrypted: Buffer.from('encrypted-narrative'),
        iv: Buffer.from('0123456789abcdef'),
        keyId: 'key-uuid-001',
    }),
    decryptClinicalNarrative: jest.fn().mockResolvedValue((0, exports.mockClinicalNarrative)()),
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
exports.mockCryptoService = mockCryptoService;
const mockKeyManagementService = () => ({
    getActiveKey: jest.fn().mockResolvedValue({
        keyId: 'key-uuid-001',
        purpose: crypto_interfaces_1.KeyPurpose.CLINICAL_NOTES,
        version: 1,
        algorithm: 'AES-256-GCM',
        isActive: true,
        createdAt: new Date(),
    }),
    getKeyById: jest.fn().mockResolvedValue(Buffer.alloc(32, 0)),
    createKey: jest.fn().mockResolvedValue({
        keyId: 'new-key-uuid',
        purpose: crypto_interfaces_1.KeyPurpose.CLINICAL_NOTES,
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
exports.mockKeyManagementService = mockKeyManagementService;
const mockSessionsRepository = () => ({
    create: jest.fn().mockResolvedValue((0, exports.mockClinicalSession)()),
    findById: jest.fn().mockResolvedValue((0, exports.mockClinicalSession)()),
    findByAppointment: jest.fn().mockResolvedValue(null),
    findByTherapist: jest.fn().mockResolvedValue([(0, exports.mockClinicalSession)()]),
    findByPatient: jest.fn().mockResolvedValue([(0, exports.mockClinicalSession)()]),
    update: jest.fn().mockResolvedValue((0, exports.mockClinicalSession)()),
    sign: jest.fn().mockResolvedValue((0, exports.mockSignedSession)()),
    getVersionCount: jest.fn().mockResolvedValue(0),
    createVersion: jest.fn().mockResolvedValue({}),
    getVersions: jest.fn().mockResolvedValue([]),
});
exports.mockSessionsRepository = mockSessionsRepository;
const mockAppointmentsRepository = () => ({
    findById: jest.fn().mockResolvedValue((0, exports.mockAppointment)()),
    update: jest.fn().mockResolvedValue((0, exports.mockAppointment)()),
});
exports.mockAppointmentsRepository = mockAppointmentsRepository;
const mockShadowNotesRepository = () => ({
    create: jest.fn().mockResolvedValue((0, exports.mockShadowNote)()),
    findById: jest.fn().mockResolvedValue((0, exports.mockShadowNote)()),
    findBySession: jest.fn().mockResolvedValue(null),
    findByTherapist: jest.fn().mockResolvedValue([(0, exports.mockShadowNote)()]),
    existsForSession: jest.fn().mockResolvedValue(false),
    update: jest.fn().mockResolvedValue((0, exports.mockShadowNote)()),
    softDelete: jest.fn().mockResolvedValue((0, exports.mockShadowNote)({ deletedAt: new Date() })),
});
exports.mockShadowNotesRepository = mockShadowNotesRepository;
const mockPatientsRepository = () => ({
    create: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
    findById: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
    findByTherapist: jest.fn().mockResolvedValue([(0, exports.mockPatient)()]),
    findWithCollaborations: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
    update: jest.fn().mockResolvedValue((0, exports.mockPatient)()),
    softDelete: jest.fn().mockResolvedValue((0, exports.mockPatient)({ deletedAt: new Date() })),
});
exports.mockPatientsRepository = mockPatientsRepository;
const createMockIV = () => Buffer.from('0123456789abcdef');
exports.createMockIV = createMockIV;
const createMockEncryptedData = () => {
    const ciphertext = Buffer.alloc(50, 0);
    const authTag = Buffer.alloc(16, 1);
    return Buffer.concat([ciphertext, authTag]);
};
exports.createMockEncryptedData = createMockEncryptedData;
const flushPromises = () => new Promise(resolve => setImmediate(resolve));
exports.flushPromises = flushPromises;
//# sourceMappingURL=test-utils.js.map