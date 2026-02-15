import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ClinicalNarrative, KeyPurpose } from '../crypto/interfaces/crypto.interfaces';
export declare const mockTerapeuta: (overrides?: Partial<AuthenticatedUser>) => AuthenticatedUser;
export declare const mockSupervisor: (overrides?: Partial<AuthenticatedUser>) => AuthenticatedUser;
export declare const mockAuditor: (overrides?: Partial<AuthenticatedUser>) => AuthenticatedUser;
export declare const mockAsistente: (overrides?: Partial<AuthenticatedUser>) => AuthenticatedUser;
export declare const mockPatient: (overrides?: Partial<any>) => {
    id: string;
    externalId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    contactEmail: string;
    contactPhone: string;
    isActive: boolean;
    deletedAt: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockAppointment: (overrides?: Partial<any>) => {
    id: string;
    patientId: string;
    therapistId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    status: string;
    sessionType: string;
    deletedAt: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockClinicalSession: (overrides?: Partial<any>) => {
    id: string;
    appointmentId: string;
    patientId: string;
    therapistId: string;
    startedAt: Date;
    endedAt: null;
    durationMinutes: null;
    clinicalNarrativeEncrypted: null;
    narrativeIV: null;
    narrativeKeyId: null;
    signedAt: null;
    signatureHash: null;
    isDraft: boolean;
    isLocked: boolean;
    deletedAt: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockSignedSession: (overrides?: Partial<any>) => {
    signedAt: Date;
    signatureHash: string;
    isDraft: boolean;
    isLocked: boolean;
    id: string;
    appointmentId: string;
    patientId: string;
    therapistId: string;
    startedAt: Date;
    endedAt: null;
    durationMinutes: null;
    clinicalNarrativeEncrypted: null;
    narrativeIV: null;
    narrativeKeyId: null;
    deletedAt: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockShadowNote: (overrides?: Partial<any>) => {
    id: string;
    sessionId: string;
    therapistId: string;
    contentEncrypted: Buffer<ArrayBuffer>;
    contentIV: Buffer<ArrayBuffer>;
    deletedAt: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockClinicalNarrative: () => ClinicalNarrative;
export declare const mockCollaboration: (overrides?: Partial<any>) => {
    id: string;
    patientId: string;
    userId: string;
    contextualRole: "TERAPEUTA_TITULAR";
    startDate: Date;
    endDate: null;
    isActive: boolean;
    deletedAt: null;
    createdAt: Date;
    updatedAt: Date;
};
export declare const mockEncryptionKey: (overrides?: Partial<any>) => {
    id: string;
    purpose: KeyPurpose;
    version: number;
    algorithm: string;
    isActive: boolean;
    activatedAt: Date;
    rotatedAt: null;
    expiresAt: null;
    vaultKeyPath: string;
    createdAt: Date;
};
export declare const mockPrismaService: () => {
    auditLog: {
        create: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
    };
    encryptionKey: {
        findMany: jest.Mock<any, any, any>;
        findFirst: jest.Mock<any, any, any>;
        findUnique: jest.Mock<any, any, any>;
        create: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
    };
    patient: {
        create: jest.Mock<any, any, any>;
        findUnique: jest.Mock<any, any, any>;
        findMany: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
    };
    clinicalSession: {
        create: jest.Mock<any, any, any>;
        findUnique: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
    };
    shadowNote: {
        create: jest.Mock<any, any, any>;
        findUnique: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
    };
};
export declare const mockAuditService: () => {
    log: jest.Mock<any, any, any>;
    logAccessDenied: jest.Mock<any, any, any>;
    findByPatient: jest.Mock<any, any, any>;
    findByActor: jest.Mock<any, any, any>;
};
export declare const mockCryptoService: () => {
    encryptClinicalNarrative: jest.Mock<any, any, any>;
    decryptClinicalNarrative: jest.Mock<any, any, any>;
    encryptShadowNote: jest.Mock<any, any, any>;
    decryptShadowNote: jest.Mock<any, any, any>;
    generateSessionSignature: jest.Mock<any, any, any>;
    generateHash: jest.Mock<any, any, any>;
    reEncryptClinicalNarrative: jest.Mock<any, any, any>;
    verifyPayloadIntegrity: jest.Mock<any, any, any>;
};
export declare const mockKeyManagementService: () => {
    getActiveKey: jest.Mock<any, any, any>;
    getKeyById: jest.Mock<any, any, any>;
    createKey: jest.Mock<any, any, any>;
    rotateKey: jest.Mock<any, any, any>;
    deriveUserPersonalKey: jest.Mock<any, any, any>;
    validateKeyForDecryption: jest.Mock<any, any, any>;
    getKeyMetadata: jest.Mock<any, any, any>;
    listKeys: jest.Mock<any, any, any>;
};
export declare const mockSessionsRepository: () => {
    create: jest.Mock<any, any, any>;
    findById: jest.Mock<any, any, any>;
    findByAppointment: jest.Mock<any, any, any>;
    findByTherapist: jest.Mock<any, any, any>;
    findByPatient: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    sign: jest.Mock<any, any, any>;
    getVersionCount: jest.Mock<any, any, any>;
    createVersion: jest.Mock<any, any, any>;
    getVersions: jest.Mock<any, any, any>;
};
export declare const mockAppointmentsRepository: () => {
    findById: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
};
export declare const mockShadowNotesRepository: () => {
    create: jest.Mock<any, any, any>;
    findById: jest.Mock<any, any, any>;
    findBySession: jest.Mock<any, any, any>;
    findByTherapist: jest.Mock<any, any, any>;
    existsForSession: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    softDelete: jest.Mock<any, any, any>;
};
export declare const mockPatientsRepository: () => {
    create: jest.Mock<any, any, any>;
    findById: jest.Mock<any, any, any>;
    findByTherapist: jest.Mock<any, any, any>;
    findWithCollaborations: jest.Mock<any, any, any>;
    update: jest.Mock<any, any, any>;
    softDelete: jest.Mock<any, any, any>;
};
export declare const createMockIV: () => Buffer;
export declare const createMockEncryptedData: () => Buffer;
export declare const flushPromises: () => Promise<unknown>;
