/*
  Warnings:

  - Added the required column `familyId` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fingerprint` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "familyId" UUID NOT NULL,
ADD COLUMN     "fingerprint" VARCHAR(64) NOT NULL,
ADD COLUMN     "revokeReason" VARCHAR(100);

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");
