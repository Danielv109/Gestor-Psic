-- CreateTable
CREATE TABLE "clinical_histories" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "therapistId" UUID NOT NULL,
    "openedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "identification" JSONB,
    "consultation" JSONB,
    "antecedents" JSONB,
    "mentalExam" JSONB,
    "diagnosticImpression" JSONB,
    "treatmentPlan" JSONB,
    "therapistSignature" VARCHAR(500),
    "signedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clinical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_histories_patientId_key" ON "clinical_histories"("patientId");

-- CreateIndex
CREATE INDEX "clinical_histories_patientId_idx" ON "clinical_histories"("patientId");

-- CreateIndex
CREATE INDEX "clinical_histories_therapistId_idx" ON "clinical_histories"("therapistId");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- AddForeignKey
ALTER TABLE "clinical_histories" ADD CONSTRAINT "clinical_histories_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_histories" ADD CONSTRAINT "clinical_histories_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
