-- CreateEnum
CREATE TYPE "LedgerKind" AS ENUM ('Grant', 'Deposit', 'Fund', 'Repay', 'Payout', 'Collateral', 'CollateralReturn', 'Withdraw');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "revenueBand" TEXT,
ADD COLUMN     "sector" TEXT,
ADD COLUMN     "taxId" TEXT;

-- AlterTable
ALTER TABLE "KybSubmission" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'sandbox',
ADD COLUMN     "providerRef" TEXT;

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "stellarAddress" TEXT NOT NULL,
    "kind" "LedgerKind" NOT NULL,
    "amountStroops" BIGINT NOT NULL,
    "provider" TEXT,
    "reference" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_stellarAddress_idx" ON "LedgerEntry"("stellarAddress");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_stellarAddress_idempotencyKey_key" ON "LedgerEntry"("stellarAddress", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Business_country_taxId_key" ON "Business"("country", "taxId");
