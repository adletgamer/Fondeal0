import { describe, expect, it } from 'vitest';
import { businessFinancingProfileSchema } from './business-financing';

const profile = {
  primaryCashFlowType: 'B2B_RECEIVABLES',
  financingUseCase: 'INVOICE_ADVANCE',
  requestedAmountBand: 'UP_TO_10K',
  preferredTermBand: 'DAYS_31_TO_90',
  b2bShareBand: null,
};
describe('self-reported financing profiles', () => {
  it('accepts the priority B2B path and a recurring-revenue growth path', () => {
    expect(businessFinancingProfileSchema.safeParse(profile).success).toBe(true);
    expect(
      businessFinancingProfileSchema.safeParse({
        ...profile,
        primaryCashFlowType: 'RECURRING_REVENUE',
        financingUseCase: 'GROWTH_CAPITAL',
      }).success,
    ).toBe(true);
  });
  it('does not offer invoice advances to an unrelated cash-flow segment', () => {
    expect(
      businessFinancingProfileSchema.safeParse({
        ...profile,
        primaryCashFlowType: 'OPERATING_REVENUE',
      }).success,
    ).toBe(false);
  });
  it('does not attach debt terms or an approval to a pre-revenue business', () => {
    expect(
      businessFinancingProfileSchema.safeParse({ ...profile, primaryCashFlowType: 'PRE_REVENUE' })
        .success,
    ).toBe(false);
    const preRevenue = {
      ...profile,
      primaryCashFlowType: 'PRE_REVENUE',
      financingUseCase: null,
      requestedAmountBand: null,
      preferredTermBand: null,
    };
    expect(businessFinancingProfileSchema.safeParse(preRevenue).success).toBe(true);
    expect(
      businessFinancingProfileSchema.safeParse({ ...preRevenue, approved: true }).success,
    ).toBe(false);
  });
  it('requires financing ranges for operating businesses', () => {
    expect(
      businessFinancingProfileSchema.safeParse({ ...profile, requestedAmountBand: null }).success,
    ).toBe(false);
  });
});
