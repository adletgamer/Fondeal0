-- Additive: early-access waitlist (docs/strategy/2026-10-20-landing-refactor-plan.md §7).
-- New enums and one new table only; no existing table, column or row is touched.

-- CreateEnum
CREATE TYPE "WaitlistProfile" AS ENUM ('StartupPreSeed', 'StartupRevenue', 'Mype', 'Funder', 'Other');

-- CreateEnum
CREATE TYPE "WaitlistCountry" AS ENUM ('Peru', 'UnitedStates', 'OtherCountry', 'NotIncorporated');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profile" "WaitlistProfile" NOT NULL,
    "country" "WaitlistCountry" NOT NULL,
    "companyName" TEXT,
    "interviewOptIn" BOOLEAN NOT NULL DEFAULT false,
    "consentVersion" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "ipHash" TEXT,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_email_key" ON "WaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "WaitlistEntry_ipHash_createdAt_idx" ON "WaitlistEntry"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistEntry_profile_idx" ON "WaitlistEntry"("profile");

