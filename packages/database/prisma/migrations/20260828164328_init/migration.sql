-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('None', 'Processing', 'Accepted', 'Rejected');

-- CreateEnum
CREATE TYPE "RiskBand" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('Draft', 'Open', 'Funded', 'Active', 'Repaid', 'Defaulted', 'Cancelled');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Business', 'Investor');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "stellarAddress" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWallet" (
    "id" TEXT NOT NULL,
    "privyUserId" TEXT,
    "stellarAddress" TEXT NOT NULL,
    "role" "UserRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KybSubmission" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "KybStatus" NOT NULL DEFAULT 'Processing',
    "fields" JSONB NOT NULL,
    "dataHash" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KybSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassportProjection" (
    "businessId" TEXT NOT NULL,
    "kybStatus" "KybStatus" NOT NULL,
    "score" INTEGER NOT NULL,
    "riskBand" "RiskBand" NOT NULL,
    "loansTotal" INTEGER NOT NULL DEFAULT 0,
    "loansRepaid" INTEGER NOT NULL DEFAULT 0,
    "onTimeStreak" INTEGER NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataHash" TEXT NOT NULL,

    CONSTRAINT "PassportProjection_pkey" PRIMARY KEY ("businessId")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" TEXT NOT NULL,
    "funded" TEXT NOT NULL DEFAULT '0',
    "termDays" INTEGER NOT NULL,
    "aprBps" INTEGER NOT NULL,
    "riskBand" "RiskBand" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'Draft',
    "onchainId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funding" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "investor" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repayment" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "onTime" BOOLEAN NOT NULL DEFAULT true,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreEvent" (
    "id" TEXT NOT NULL,
    "business" TEXT NOT NULL,
    "scoreBefore" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_stellarAddress_key" ON "Business"("stellarAddress");

-- CreateIndex
CREATE INDEX "Business_country_idx" ON "Business"("country");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_privyUserId_key" ON "UserWallet"("privyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_stellarAddress_key" ON "UserWallet"("stellarAddress");

-- CreateIndex
CREATE INDEX "KybSubmission_businessId_idx" ON "KybSubmission"("businessId");

-- CreateIndex
CREATE INDEX "KybSubmission_status_idx" ON "KybSubmission"("status");

-- CreateIndex
CREATE INDEX "Opportunity_businessId_idx" ON "Opportunity"("businessId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Funding_opportunityId_idx" ON "Funding"("opportunityId");

-- CreateIndex
CREATE INDEX "Funding_investor_idx" ON "Funding"("investor");

-- CreateIndex
CREATE INDEX "Repayment_opportunityId_idx" ON "Repayment"("opportunityId");

-- CreateIndex
CREATE INDEX "ScoreEvent_business_idx" ON "ScoreEvent"("business");

-- AddForeignKey
ALTER TABLE "KybSubmission" ADD CONSTRAINT "KybSubmission_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PassportProjection" ADD CONSTRAINT "PassportProjection_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funding" ADD CONSTRAINT "Funding_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
