// =============================================================================
// TYPES - API Response & Auth
// Matches backend v1.0.0-frozen contracts
// =============================================================================

// Global Role enum - matches backend
export enum GlobalRole {
    TERAPEUTA = 'TERAPEUTA',
    ASISTENTE = 'ASISTENTE',
    SUPERVISOR = 'SUPERVISOR',
    AUDITOR = 'AUDITOR',
}

// Session Legal Status - matches backend
export enum SessionLegalStatus {
    DRAFT = 'DRAFT',
    PENDING_REVIEW = 'PENDING_REVIEW',
    SIGNED = 'SIGNED',
    AMENDED = 'AMENDED',
    VOIDED = 'VOIDED',
}

// Appointment Status - matches backend
export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface User {
    id: string;
    email: string;
    globalRole: GlobalRole;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
}

export interface LoginResponse {
    accessToken: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// =============================================================================
// PATIENT TYPES
// =============================================================================

export interface Patient {
    id: string;
    externalId?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    // Prisma field names
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    // Custodian (for minors)
    custodianName?: string;
    custodianPhone?: string;
    custodianEmail?: string;
    custodianRelation?: string;
    // Emergency contact
    emergencyContactName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    // Status
    isActive: boolean;
    // Risk alert
    isHighRisk?: boolean;
    riskLevel?: string;
    riskNotes?: string;
    riskAssessedAt?: string;
    createdAt: string;
    updatedAt: string;
    // Legacy aliases (some components may use these)
    email?: string;
    phone?: string;
    isMinor?: boolean;
}

export interface CreatePatientDto {
    externalId?: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender?: string;
    email?: string;
    phone?: string;
    isMinor?: boolean;
    custodianName?: string;
    custodianPhone?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> { }

// =============================================================================
// SESSION TYPES
// =============================================================================

export interface ClinicalNarrative {
    subjectiveReport?: string;
    objectiveObservation?: string;
    assessment?: string;
    plan?: string;
    additionalNotes?: string;
}

export interface ClinicalSession {
    id: string;
    appointmentId: string;
    patientId: string;
    therapistId: string;
    startedAt: string;
    endedAt?: string;
    durationMinutes?: number;
    clinicalNarrative?: ClinicalNarrative;
    signedAt?: string;
    signatureHash?: string;
    isDraft: boolean;
    isLocked: boolean;
    legalStatus: SessionLegalStatus;
    createdAt: string;
    updatedAt: string;
    // Related data (populated by backend includes)
    patient?: Patient;
    therapist?: User;
    // Derived/computed fields
    sessionDate?: string;       // May be derived from startedAt
    sessionType?: string;       // May come from appointment
    narrative?: string;         // Flattened from clinicalNarrative
    contentHash?: string;       // May be same as signatureHash
}

export interface CreateSessionDto {
    appointmentId: string;
    startedAt: string;
    clinicalNarrative?: ClinicalNarrative;
}

export interface UpdateSessionDto {
    clinicalNarrative?: ClinicalNarrative;
    endedAt?: string;
}

export interface SignSessionDto {
    signatureConfirmation: string;
}

// =============================================================================
// APPOINTMENT TYPES
// =============================================================================

export interface Appointment {
    id: string;
    patientId: string;
    therapistId: string;
    scheduledStart: string;
    scheduledEnd: string;
    status: AppointmentStatus;
    sessionType: string;
    adminNotes?: string;
    cancelledAt?: string;
    cancelReason?: string;
    confirmedAt?: string;
    reminderSentAt?: string;
    createdAt: string;
    updatedAt: string;
    patient?: Patient;
}

export interface CreateAppointmentDto {
    patientId: string;
    scheduledStart: string;
    scheduledEnd: string;
    sessionType?: string;
    adminNotes?: string;
}

export interface UpdateAppointmentDto extends Partial<CreateAppointmentDto> { }

export interface CancelAppointmentDto {
    reason: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface ApiError {
    statusCode: number;
    message: string;
    error: string;
    validationErrors?: ValidationError[];
}

export interface ValidationError {
    field: string;
    constraints: Record<string, string>;
}

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export interface WorkflowStatus {
    appointmentId: string;
    appointmentStatus: AppointmentStatus;
    sessionId?: string;
    sessionStatus?: SessionLegalStatus;
    canStartSession: boolean;
    canEndSession: boolean;
    canSign: boolean;
}

export interface StartSessionDto {
    initialNarrative?: ClinicalNarrative;
}

export interface EndSessionDto {
    narrative: ClinicalNarrative;
}

export interface WorkflowResult {
    message: string;
    session?: {
        id: string;
        startedAt?: string;
        endedAt?: string;
        signedAt?: string;
        isLocked?: boolean;
        durationMinutes?: number;
    };
    appointmentStatus?: AppointmentStatus;
    appointment?: Appointment;
    signatureHash?: string;
    nextAction?: string;
    warning?: string;
}

// =============================================================================
// CLINICAL HISTORY (Historia Clínica Psicológica)
// =============================================================================

export interface CHIdentification {
    birthPlace?: string;
    maritalStatus?: string;
    education?: string;
    occupation?: string;
    address?: string;
    phone?: string;
    emergencyContact?: string;
    referralSource?: string;
}

export interface CHConsultation {
    patientStatement?: string;
    onsetAndCourse?: string;
}

export interface CHSubstance {
    substance?: string;
    frequency?: string;
    amount?: string;
}

export interface CHPersonalPathological {
    chronicDiseases?: string;
    currentMedications?: string;
    substances?: CHSubstance[];
    previousTreatments?: boolean;
    previousTreatmentsDetails?: string;
}

export interface CHAntecedents {
    personalPathological?: CHPersonalPathological;
    hereditaryFamily?: string;
    familyDynamics?: string;
}

export interface CHMentalExam {
    appearance?: string;
    consciousness?: string;
    orientation?: string[];
    language?: string;
    memory?: string;
    mood?: string;
    thinking?: string;
    judgmentOfReality?: string;
}

export interface CHDiagnosticImpression {
    hypothesis?: string;
    diagnosticCode?: string;
}

export interface CHTreatmentPlan {
    objectives?: string[];
    modality?: string;
    frequency?: string;
    prognosis?: string;
}

export interface ClinicalHistory {
    id: string;
    patientId: string;
    therapistId: string;
    openedAt: string;
    identification?: CHIdentification;
    consultation?: CHConsultation;
    antecedents?: CHAntecedents;
    mentalExam?: CHMentalExam;
    diagnosticImpression?: CHDiagnosticImpression;
    treatmentPlan?: CHTreatmentPlan;
    therapistSignature?: string;
    signedAt?: string;
    createdAt: string;
    updatedAt: string;
    therapist?: {
        id: string;
        firstName: string;
        lastName: string;
        licenseNumber?: string;
    };
}

export interface CreateClinicalHistoryDto {
    patientId: string;
    openedAt?: string;
    identification?: CHIdentification;
    consultation?: CHConsultation;
    antecedents?: CHAntecedents;
    mentalExam?: CHMentalExam;
    diagnosticImpression?: CHDiagnosticImpression;
    treatmentPlan?: CHTreatmentPlan;
}

export interface UpdateClinicalHistoryDto {
    identification?: CHIdentification;
    consultation?: CHConsultation;
    antecedents?: CHAntecedents;
    mentalExam?: CHMentalExam;
    diagnosticImpression?: CHDiagnosticImpression;
    treatmentPlan?: CHTreatmentPlan;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    WAIVED = 'WAIVED',
}

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CARD = 'CARD',
    OTHER = 'OTHER',
}

export interface SessionPayment {
    id: string;
    sessionId: string;
    patientId: string;
    therapistId: string;
    amount: number;
    amountPaid: number;
    status: PaymentStatus;
    method?: PaymentMethod;
    paidAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    patient?: { id: string; firstName: string; lastName: string; externalId: string };
    session?: { id: string; startedAt: string };
}

export interface PatientBalance {
    totalOwed: number;
    pendingCount: number;
}

// =============================================================================
// PSYCH TEST TYPES
// =============================================================================

export interface PsychTestResult {
    id: string;
    patientId: string;
    sessionId?: string;
    therapistId: string;
    testName: string;
    testCode?: string;
    rawScore: number;
    maxScore?: number;
    severity?: string;
    percentile?: number;
    notes?: string;
    appliedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface TestCatalogEntry {
    code: string;
    name: string;
    maxScore: number | null;
    severities: { min: number; max: number; label: string }[];
}

// =============================================================================
// ATTACHMENT TYPES
// =============================================================================

export enum AttachmentCategory {
    GENOGRAM = 'GENOGRAM',
    PSYCH_TEST_SCAN = 'PSYCH_TEST_SCAN',
    EXTERNAL_REPORT = 'EXTERNAL_REPORT',
    CONSENT_FORM = 'CONSENT_FORM',
    DRAWING = 'DRAWING',
    OTHER = 'OTHER',
}

export interface PatientAttachment {
    id: string;
    patientId: string;
    uploadedBy: string;
    sessionId?: string;
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    storagePath: string;
    category: AttachmentCategory;
    description?: string;
    createdAt: string;
}

