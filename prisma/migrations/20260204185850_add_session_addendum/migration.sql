-- CreateTable
CREATE TABLE "session_addendums" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "contentEncrypted" BYTEA NOT NULL,
    "contentIV" BYTEA NOT NULL,
    "contentKeyId" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "authorId" UUID NOT NULL,
    "signedAt" TIMESTAMPTZ,
    "signatureHash" VARCHAR(256),
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_addendums_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "session_addendums_sessionId_idx" ON "session_addendums"("sessionId");

-- CreateIndex
CREATE INDEX "session_addendums_authorId_idx" ON "session_addendums"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "session_addendums_sessionId_sequenceNumber_key" ON "session_addendums"("sessionId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "session_addendums" ADD CONSTRAINT "session_addendums_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "clinical_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
