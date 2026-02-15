-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('TERAPEUTA', 'ASISTENTE', 'SUPERVISOR', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ContextualRole" AS ENUM ('TERAPEUTA_TITULAR', 'TERAPEUTA_APOYO', 'SUPERVISOR_CASO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('INDIVIDUAL', 'COUPLE', 'FAMILY', 'GROUP');

-- CreateEnum
CREATE TYPE "SessionLegalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'SIGNED', 'AMENDED', 'VOIDED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'DECRYPT', 'SIGN', 'AMEND', 'VOID', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED');

-- CreateEnum
CREATE TYPE "AuditResource" AS ENUM ('USER', 'PATIENT', 'APPOINTMENT', 'CLINICAL_SESSION', 'SHADOW_NOTE', 'CLINICAL_COLLABORATION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "globalRole" "GlobalRole" NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "licenseNumber" VARCHAR(50),
    "phone" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" VARCHAR(255),
    "lastLoginAt" TIMESTAMPTZ,
    "passwordChangedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMPTZ,
    "userAgent" VARCHAR(500),
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "externalId" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "dateOfBirth" DATE,
    "gender" VARCHAR(20),
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(20),
    "address" VARCHAR(500),
    "custodianName" VARCHAR(200),
    "custodianPhone" VARCHAR(20),
    "custodianEmail" VARCHAR(255),
    "custodianRelation" VARCHAR(50),
    "emergencyContactName" VARCHAR(200),
    "emergencyPhone" VARCHAR(20),
    "emergencyRelation" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_collaborations" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contextualRole" "ContextualRole" NOT NULL,
    "startDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinical_collaborations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "therapistId" UUID NOT NULL,
    "scheduledStart" TIMESTAMPTZ NOT NULL,
    "scheduledEnd" TIMESTAMPTZ NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "sessionType" "SessionType" NOT NULL DEFAULT 'INDIVIDUAL',
    "adminNotes" VARCHAR(500),
    "cancelledAt" TIMESTAMPTZ,
    "cancelReason" VARCHAR(255),
    "confirmedAt" TIMESTAMPTZ,
    "reminderSentAt" TIMESTAMPTZ,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_sessions" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "therapistId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "endedAt" TIMESTAMPTZ,
    "durationMinutes" INTEGER,
    "clinicalNarrativeEncrypted" BYTEA,
    "narrativeIV" BYTEA,
    "narrativeKeyId" UUID,
    "signedAt" TIMESTAMPTZ,
    "signatureHash" VARCHAR(256),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "legalStatus" "SessionLegalStatus" NOT NULL DEFAULT 'DRAFT',
    "amendedAt" TIMESTAMPTZ,
    "amendReason" VARCHAR(500),
    "amendedBy" UUID,
    "voidedAt" TIMESTAMPTZ,
    "voidReason" VARCHAR(500),
    "voidedBy" UUID,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinical_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_session_versions" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "narrativeSnapshotEncrypted" BYTEA NOT NULL,
    "narrativeIV" BYTEA NOT NULL,
    "narrativeKeyId" UUID NOT NULL,
    "changedBy" UUID NOT NULL,
    "changeReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_session_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shadow_notes" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "therapistId" UUID NOT NULL,
    "contentEncrypted" BYTEA NOT NULL,
    "contentIV" BYTEA NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shadow_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorRole" "GlobalRole",
    "actorIp" VARCHAR(45) NOT NULL,
    "actorUserAgent" VARCHAR(500),
    "action" "AuditAction" NOT NULL,
    "resource" "AuditResource" NOT NULL,
    "resourceId" UUID NOT NULL,
    "patientId" UUID,
    "details" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failureReason" VARCHAR(255),
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encryption_keys" (
    "id" UUID NOT NULL,
    "purpose" VARCHAR(50) NOT NULL,
    "version" INTEGER NOT NULL,
    "algorithm" VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotatedAt" TIMESTAMPTZ,
    "expiresAt" TIMESTAMPTZ,
    "vaultKeyPath" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encryption_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_versions" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "changedBy" UUID NOT NULL,
    "changeReason" VARCHAR(255),
    "changedFields" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_globalRole_idx" ON "users"("globalRole");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "users_isActive_deletedAt_idx" ON "users"("isActive", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_isRevoked_idx" ON "refresh_tokens"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "patients_externalId_key" ON "patients"("externalId");

-- CreateIndex
CREATE INDEX "patients_externalId_idx" ON "patients"("externalId");

-- CreateIndex
CREATE INDEX "patients_lastName_firstName_idx" ON "patients"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "patients_deletedAt_idx" ON "patients"("deletedAt");

-- CreateIndex
CREATE INDEX "patients_isActive_deletedAt_idx" ON "patients"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "patients_createdBy_idx" ON "patients"("createdBy");

-- CreateIndex
CREATE INDEX "clinical_collaborations_patientId_isActive_deletedAt_idx" ON "clinical_collaborations"("patientId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "clinical_collaborations_userId_isActive_deletedAt_idx" ON "clinical_collaborations"("userId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "clinical_collaborations_contextualRole_idx" ON "clinical_collaborations"("contextualRole");

-- CreateIndex
CREATE INDEX "clinical_collaborations_startDate_endDate_idx" ON "clinical_collaborations"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_collaborations_patientId_userId_isActive_key" ON "clinical_collaborations"("patientId", "userId", "isActive");

-- CreateIndex
CREATE INDEX "appointments_patientId_status_idx" ON "appointments"("patientId", "status");

-- CreateIndex
CREATE INDEX "appointments_therapistId_status_idx" ON "appointments"("therapistId", "status");

-- CreateIndex
CREATE INDEX "appointments_scheduledStart_scheduledEnd_idx" ON "appointments"("scheduledStart", "scheduledEnd");

-- CreateIndex
CREATE INDEX "appointments_status_deletedAt_idx" ON "appointments"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "appointments_scheduledStart_status_deletedAt_idx" ON "appointments"("scheduledStart", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_sessions_appointmentId_key" ON "clinical_sessions"("appointmentId");

-- CreateIndex
CREATE INDEX "clinical_sessions_patientId_deletedAt_idx" ON "clinical_sessions"("patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "clinical_sessions_therapistId_deletedAt_idx" ON "clinical_sessions"("therapistId", "deletedAt");

-- CreateIndex
CREATE INDEX "clinical_sessions_startedAt_idx" ON "clinical_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "clinical_sessions_isDraft_isLocked_idx" ON "clinical_sessions"("isDraft", "isLocked");

-- CreateIndex
CREATE INDEX "clinical_sessions_signedAt_idx" ON "clinical_sessions"("signedAt");

-- CreateIndex
CREATE INDEX "clinical_sessions_legalStatus_idx" ON "clinical_sessions"("legalStatus");

-- CreateIndex
CREATE INDEX "clinical_session_versions_sessionId_idx" ON "clinical_session_versions"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_session_versions_sessionId_versionNumber_key" ON "clinical_session_versions"("sessionId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "shadow_notes_sessionId_key" ON "shadow_notes"("sessionId");

-- CreateIndex
CREATE INDEX "shadow_notes_therapistId_deletedAt_idx" ON "shadow_notes"("therapistId", "deletedAt");

-- CreateIndex
CREATE INDEX "shadow_notes_sessionId_idx" ON "shadow_notes"("sessionId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_patientId_idx" ON "audit_logs"("patientId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_timestamp_idx" ON "audit_logs"("actorId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_patientId_timestamp_idx" ON "audit_logs"("patientId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_action_timestamp_idx" ON "audit_logs"("resource", "action", "timestamp");

-- CreateIndex
CREATE INDEX "encryption_keys_purpose_isActive_idx" ON "encryption_keys"("purpose", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_keys_purpose_version_key" ON "encryption_keys"("purpose", "version");

-- CreateIndex
CREATE INDEX "patient_versions_patientId_idx" ON "patient_versions"("patientId");

-- CreateIndex
CREATE INDEX "patient_versions_changedBy_idx" ON "patient_versions"("changedBy");

-- CreateIndex
CREATE INDEX "patient_versions_createdAt_idx" ON "patient_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "patient_versions_patientId_versionNumber_key" ON "patient_versions"("patientId", "versionNumber");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_collaborations" ADD CONSTRAINT "clinical_collaborations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_collaborations" ADD CONSTRAINT "clinical_collaborations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_sessions" ADD CONSTRAINT "clinical_sessions_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_session_versions" ADD CONSTRAINT "clinical_session_versions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_notes" ADD CONSTRAINT "shadow_notes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shadow_notes" ADD CONSTRAINT "shadow_notes_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_versions" ADD CONSTRAINT "patient_versions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
