-- Additive intake metadata. Existing decisions and financial records are unchanged.
ALTER TABLE "KybSubmission"
  ADD COLUMN "idempotencyKey" TEXT,
  ADD COLUMN "consentAt" TIMESTAMP(3),
  ADD COLUMN "consentVersion" TEXT;

CREATE UNIQUE INDEX "KybSubmission_idempotencyKey_key" ON "KybSubmission"("idempotencyKey");

CREATE TABLE "EvidenceReference" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "kybSubmissionId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Declared',
  "privateObjectKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "EvidenceReference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EvidenceReference_status_check" CHECK ("status" IN ('Declared')),
  CONSTRAINT "EvidenceReference_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EvidenceReference_kybSubmissionId_fkey" FOREIGN KEY ("kybSubmissionId") REFERENCES "KybSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "EvidenceReference_kybSubmissionId_kind_sourceType_key" ON "EvidenceReference"("kybSubmissionId", "kind", "sourceType");
CREATE INDEX "EvidenceReference_businessId_createdAt_idx" ON "EvidenceReference"("businessId", "createdAt");

CREATE TABLE "ProviderCheck" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "kybSubmissionId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "checkType" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "evidenceReferenceId" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "reasonCodes" JSONB NOT NULL,
  "failureCode" TEXT,
  "retryable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderCheck_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProviderCheck_result_check" CHECK (
    ("sourceType" = 'synthetic' AND "result" IN ('SyntheticPass', 'SyntheticFail', 'Unavailable'))
    OR ("sourceType" <> 'synthetic' AND "result" IN ('Unavailable', 'NeedsReview'))
  ),
  CONSTRAINT "ProviderCheck_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProviderCheck_kybSubmissionId_fkey" FOREIGN KEY ("kybSubmissionId") REFERENCES "KybSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ProviderCheck_evidenceReferenceId_fkey" FOREIGN KEY ("evidenceReferenceId") REFERENCES "EvidenceReference"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProviderCheck_idempotencyKey_key" ON "ProviderCheck"("idempotencyKey");
CREATE INDEX "ProviderCheck_businessId_createdAt_idx" ON "ProviderCheck"("businessId", "createdAt");
CREATE INDEX "ProviderCheck_kybSubmissionId_idx" ON "ProviderCheck"("kybSubmissionId");

CREATE TABLE "VerificationAuditEvent" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "kybSubmissionId" TEXT NOT NULL,
  "actorPrivyUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationAuditEvent_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VerificationAuditEvent_kybSubmissionId_fkey" FOREIGN KEY ("kybSubmissionId") REFERENCES "KybSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "VerificationAuditEvent_businessId_createdAt_idx" ON "VerificationAuditEvent"("businessId", "createdAt");
CREATE INDEX "VerificationAuditEvent_kybSubmissionId_createdAt_idx" ON "VerificationAuditEvent"("kybSubmissionId", "createdAt");
