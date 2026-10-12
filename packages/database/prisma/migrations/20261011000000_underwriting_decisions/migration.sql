-- Additive only: existing KYB, Passport and financial records are untouched.
CREATE TYPE "UnderwritingStatus" AS ENUM ('Review', 'Approved', 'Declined');

CREATE TABLE "UnderwritingDecision" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kybSubmissionId" TEXT NOT NULL,
    "status" "UnderwritingStatus" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "evidenceRefs" JSONB NOT NULL,
    "decidedBy" TEXT,
    "maxPrincipalStroops" BIGINT,
    "maxTermDays" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnderwritingDecision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UnderwritingDecision_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UnderwritingDecision_kybSubmissionId_fkey" FOREIGN KEY ("kybSubmissionId") REFERENCES "KybSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UnderwritingDecision_maxPrincipalStroops_check" CHECK ("maxPrincipalStroops" IS NULL OR "maxPrincipalStroops" > 0),
    CONSTRAINT "UnderwritingDecision_maxTermDays_check" CHECK ("maxTermDays" IS NULL OR "maxTermDays" > 0)
);

CREATE INDEX "UnderwritingDecision_businessId_createdAt_idx" ON "UnderwritingDecision"("businessId", "createdAt");
CREATE INDEX "UnderwritingDecision_kybSubmissionId_idx" ON "UnderwritingDecision"("kybSubmissionId");

-- Prevent two concurrent applications from both remaining in review.
CREATE UNIQUE INDEX "KybSubmission_one_processing_per_business"
ON "KybSubmission"("businessId") WHERE "status" = 'Processing';
