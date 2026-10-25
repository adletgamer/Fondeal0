CREATE TABLE "EvidenceAcquisition" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kybSubmissionId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "quotedAmount" TEXT,
    "paidAmount" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Pending',
    "paymentTxHash" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "responseHash" TEXT,
    "failureCode" TEXT,
    "retryable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceAcquisition_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EvidenceAcquisition_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvidenceAcquisition_kybSubmissionId_fkey" FOREIGN KEY ("kybSubmissionId") REFERENCES "KybSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvidenceAcquisition_paymentStatus_check" CHECK ("paymentStatus" IN ('Pending', 'Authorized', 'Paid', 'Fulfilled', 'Failed'))
);

CREATE UNIQUE INDEX "EvidenceAcquisition_idempotencyKey_key" ON "EvidenceAcquisition"("idempotencyKey");
CREATE INDEX "EvidenceAcquisition_businessId_createdAt_idx" ON "EvidenceAcquisition"("businessId", "createdAt");
CREATE INDEX "EvidenceAcquisition_kybSubmissionId_createdAt_idx" ON "EvidenceAcquisition"("kybSubmissionId", "createdAt");
CREATE INDEX "EvidenceAcquisition_providerId_evidenceType_country_idx" ON "EvidenceAcquisition"("providerId", "evidenceType", "country");

ALTER TABLE "ProviderCheck" ADD COLUMN "evidenceAcquisitionId" TEXT;
ALTER TABLE "ProviderCheck" ADD CONSTRAINT "ProviderCheck_evidenceAcquisitionId_fkey" FOREIGN KEY ("evidenceAcquisitionId") REFERENCES "EvidenceAcquisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ProviderCheck_evidenceAcquisitionId_idx" ON "ProviderCheck"("evidenceAcquisitionId");
