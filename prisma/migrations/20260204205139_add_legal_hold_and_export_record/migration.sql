-- CreateTable
CREATE TABLE "legal_holds" (
    "id" UUID NOT NULL,
    "resourceType" VARCHAR(50) NOT NULL,
    "resourceId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "caseNumber" VARCHAR(100),
    "holdUntil" TIMESTAMPTZ,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "releasedBy" UUID,
    "releasedAt" TIMESTAMPTZ,
    "releaseReason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_records" (
    "id" UUID NOT NULL,
    "exportedBy" UUID NOT NULL,
    "exportedByIp" VARCHAR(45) NOT NULL,
    "resourceType" VARCHAR(50) NOT NULL,
    "resourceId" UUID NOT NULL,
    "patientId" UUID,
    "format" VARCHAR(20) NOT NULL,
    "includesPII" BOOLEAN NOT NULL DEFAULT false,
    "maskedPII" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "recordCount" INTEGER NOT NULL DEFAULT 1,
    "fileSizeBytes" INTEGER,
    "exportedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legal_holds_resourceType_resourceId_idx" ON "legal_holds"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "legal_holds_isActive_idx" ON "legal_holds"("isActive");

-- CreateIndex
CREATE INDEX "legal_holds_createdBy_idx" ON "legal_holds"("createdBy");

-- CreateIndex
CREATE INDEX "export_records_exportedBy_idx" ON "export_records"("exportedBy");

-- CreateIndex
CREATE INDEX "export_records_resourceType_resourceId_idx" ON "export_records"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "export_records_patientId_idx" ON "export_records"("patientId");

-- CreateIndex
CREATE INDEX "export_records_exportedAt_idx" ON "export_records"("exportedAt");
