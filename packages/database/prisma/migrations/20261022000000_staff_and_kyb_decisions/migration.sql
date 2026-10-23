-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('Reviewer', 'Approver', 'Admin');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('Active', 'Suspended', 'Revoked');

-- CreateEnum
CREATE TYPE "KybDecisionKind" AS ENUM ('Claim', 'RequestInformation', 'Approve', 'Reject', 'Reopen');

-- CreateEnum
CREATE TYPE "KybCaseStatus" AS ENUM ('Received', 'InReview', 'NeedsInformation', 'Approved', 'Rejected', 'ReviewDue');

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roles" "StaffRole"[],
    "status" "StaffStatus" NOT NULL DEFAULT 'Active',
    "mfaRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KybDecision" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "kybSubmissionId" TEXT NOT NULL,
    "kind" "KybDecisionKind" NOT NULL,
    "fromStatus" "KybCaseStatus" NOT NULL,
    "toStatus" "KybCaseStatus" NOT NULL,
    "actorStaffId" TEXT NOT NULL,
    "preparedByStaffId" TEXT,
    "separationMode" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "reasonCodes" JSONB NOT NULL,
    "checklist" JSONB NOT NULL,
    "evidenceSnapshotHash" TEXT NOT NULL,
    "credentialCommitment" TEXT,
    "commitmentSalt" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "KybDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAuditEvent" (
    "id" TEXT NOT NULL,
    "actorStaffId" TEXT,
    "action" TEXT NOT NULL,
    "targetStaffId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_privyUserId_key" ON "StaffMember"("privyUserId");

-- CreateIndex
CREATE INDEX "StaffMember_status_idx" ON "StaffMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KybDecision_idempotencyKey_key" ON "KybDecision"("idempotencyKey");

-- CreateIndex
CREATE INDEX "KybDecision_kybSubmissionId_decidedAt_idx" ON "KybDecision"("kybSubmissionId", "decidedAt");

-- CreateIndex
CREATE INDEX "KybDecision_businessId_decidedAt_idx" ON "KybDecision"("businessId", "decidedAt");

-- CreateIndex
CREATE INDEX "StaffAuditEvent_actorStaffId_createdAt_idx" ON "StaffAuditEvent"("actorStaffId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffAuditEvent_targetStaffId_createdAt_idx" ON "StaffAuditEvent"("targetStaffId", "createdAt");

-- AddForeignKey
ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_kybSubmissionId_fkey" FOREIGN KEY ("kybSubmissionId") REFERENCES "KybSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_actorStaffId_fkey" FOREIGN KEY ("actorStaffId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_preparedByStaffId_fkey" FOREIGN KEY ("preparedByStaffId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Invariants Prisma cannot express (docs/adr/0011-admin-back-office-and-decision-authority.md).

-- Everyone on staff holds at least one role.
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_roles_not_empty" CHECK (cardinality("roles") > 0);

ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_separation_mode" CHECK ("separationMode" IN ('enforced', 'solo'));

-- Only an approval carries a credential commitment, its salt and an expiry, and it always carries all three.
ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_approval_fields" CHECK (
  ("kind" = 'Approve') = ("credentialCommitment" IS NOT NULL)
  AND ("credentialCommitment" IS NULL) = ("commitmentSalt" IS NULL)
  AND ("credentialCommitment" IS NULL) = ("expiresAt" IS NULL)
);

-- Under enforced separation, whoever prepared a case does not approve or reject it.
ALTER TABLE "KybDecision" ADD CONSTRAINT "KybDecision_maker_checker" CHECK (
  "separationMode" <> 'enforced'
  OR "kind" NOT IN ('Approve', 'Reject')
  OR "preparedByStaffId" IS NULL
  OR "preparedByStaffId" <> "actorStaffId"
);

-- Decision and staff audit records are append-only.
CREATE FUNCTION "fdo_reject_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "KybDecision_append_only"
  BEFORE UPDATE OR DELETE ON "KybDecision"
  FOR EACH ROW EXECUTE FUNCTION "fdo_reject_mutation"();

CREATE TRIGGER "StaffAuditEvent_append_only"
  BEFORE UPDATE OR DELETE ON "StaffAuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "fdo_reject_mutation"();
