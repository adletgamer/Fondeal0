CREATE TYPE "CashFlowType" AS ENUM ('B2B_RECEIVABLES', 'RECURRING_REVENUE', 'OPERATING_REVENUE', 'PRE_REVENUE');
CREATE TYPE "FinancingUseCase" AS ENUM ('INVOICE_ADVANCE', 'WORKING_CAPITAL', 'INVENTORY_OR_PO', 'GROWTH_CAPITAL', 'OTHER');
CREATE TYPE "RequestedAmountBand" AS ENUM ('UP_TO_10K', 'FROM_10K_TO_50K', 'FROM_50K_TO_100K', 'OVER_100K');
CREATE TYPE "PreferredTermBand" AS ENUM ('UP_TO_30_DAYS', 'DAYS_31_TO_90', 'DAYS_91_TO_180', 'OVER_180_DAYS');
CREATE TYPE "B2bShareBand" AS ENUM ('LESS_THAN_HALF', 'HALF_OR_MORE', 'ALL');

CREATE TABLE "BusinessFinancingProfile" (
    "businessId" TEXT NOT NULL,
    "primaryCashFlowType" "CashFlowType" NOT NULL,
    "financingUseCase" "FinancingUseCase",
    "requestedAmountBand" "RequestedAmountBand",
    "preferredTermBand" "PreferredTermBand",
    "b2bShareBand" "B2bShareBand",
    "profileVersion" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessFinancingProfile_pkey" PRIMARY KEY ("businessId"),
    CONSTRAINT "BusinessFinancingProfile_cash_flow_terms" CHECK (
      ("primaryCashFlowType" = 'PRE_REVENUE' AND "financingUseCase" IS NULL AND "requestedAmountBand" IS NULL AND "preferredTermBand" IS NULL)
      OR ("primaryCashFlowType" <> 'PRE_REVENUE' AND "financingUseCase" IS NOT NULL AND "requestedAmountBand" IS NOT NULL AND "preferredTermBand" IS NOT NULL)
    ),
    CONSTRAINT "BusinessFinancingProfile_b2b_share" CHECK ("primaryCashFlowType" = 'B2B_RECEIVABLES' OR "b2bShareBand" IS NULL),
    CONSTRAINT "BusinessFinancingProfile_contextual_use" CHECK (
      "financingUseCase" IS NULL
      OR ("primaryCashFlowType" = 'B2B_RECEIVABLES' AND "financingUseCase" IN ('INVOICE_ADVANCE', 'WORKING_CAPITAL', 'INVENTORY_OR_PO', 'OTHER'))
      OR ("primaryCashFlowType" = 'RECURRING_REVENUE' AND "financingUseCase" IN ('WORKING_CAPITAL', 'GROWTH_CAPITAL', 'INVENTORY_OR_PO', 'OTHER'))
      OR ("primaryCashFlowType" = 'OPERATING_REVENUE' AND "financingUseCase" IN ('WORKING_CAPITAL', 'INVENTORY_OR_PO', 'OTHER'))
    )
);
ALTER TABLE "BusinessFinancingProfile" ADD CONSTRAINT "BusinessFinancingProfile_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TYPE "BusinessProfileEventType" AS ENUM ('Saved', 'Viewed', 'DeletionRequested');
CREATE TABLE "BusinessProfileEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "actorPrivyUserId" TEXT NOT NULL,
  "action" "BusinessProfileEventType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "BusinessProfileEvent_businessId_action_createdAt_idx" ON "BusinessProfileEvent"("businessId", "action", "createdAt");
CREATE UNIQUE INDEX "BusinessProfileEvent_one_deletion_request" ON "BusinessProfileEvent"("businessId") WHERE "action" = 'DeletionRequested';
CREATE FUNCTION reject_business_profile_event_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'BusinessProfileEvent is append-only';
END;
$$;
CREATE TRIGGER "BusinessProfileEvent_append_only" BEFORE UPDATE OR DELETE ON "BusinessProfileEvent"
FOR EACH ROW EXECUTE FUNCTION reject_business_profile_event_mutation();
