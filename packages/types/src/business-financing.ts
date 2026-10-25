import { z } from 'zod';

export const CASH_FLOW_TYPES = [
  'B2B_RECEIVABLES',
  'RECURRING_REVENUE',
  'OPERATING_REVENUE',
  'PRE_REVENUE',
] as const;
export type CashFlowType = (typeof CASH_FLOW_TYPES)[number];
export const FINANCING_USE_CASES = [
  'INVOICE_ADVANCE',
  'WORKING_CAPITAL',
  'INVENTORY_OR_PO',
  'GROWTH_CAPITAL',
  'OTHER',
] as const;
export type FinancingUseCase = (typeof FINANCING_USE_CASES)[number];
export const REQUESTED_AMOUNT_BANDS = [
  'UP_TO_10K',
  'FROM_10K_TO_50K',
  'FROM_50K_TO_100K',
  'OVER_100K',
] as const;
export const PREFERRED_TERM_BANDS = [
  'UP_TO_30_DAYS',
  'DAYS_31_TO_90',
  'DAYS_91_TO_180',
  'OVER_180_DAYS',
] as const;
export const B2B_SHARE_BANDS = ['LESS_THAN_HALF', 'HALF_OR_MORE', 'ALL'] as const;
export const BUSINESS_FINANCING_PROFILE_VERSION = 'business-financing-v1';

/** Collection paths, never an underwriting/eligibility policy. */
export const FINANCING_USES_BY_CASH_FLOW: Record<CashFlowType, readonly FinancingUseCase[]> = {
  B2B_RECEIVABLES: ['INVOICE_ADVANCE', 'WORKING_CAPITAL', 'INVENTORY_OR_PO', 'OTHER'],
  RECURRING_REVENUE: ['WORKING_CAPITAL', 'GROWTH_CAPITAL', 'INVENTORY_OR_PO', 'OTHER'],
  OPERATING_REVENUE: ['WORKING_CAPITAL', 'INVENTORY_OR_PO', 'OTHER'],
  PRE_REVENUE: [],
};

export const businessFinancingProfileSchema = z
  .object({
    primaryCashFlowType: z.enum(CASH_FLOW_TYPES),
    financingUseCase: z.enum(FINANCING_USE_CASES).nullable(),
    requestedAmountBand: z.enum(REQUESTED_AMOUNT_BANDS).nullable(),
    preferredTermBand: z.enum(PREFERRED_TERM_BANDS).nullable(),
    b2bShareBand: z.enum(B2B_SHARE_BANDS).nullable(),
  })
  .strict()
  .superRefine((profile, ctx) => {
    if (profile.primaryCashFlowType !== 'B2B_RECEIVABLES' && profile.b2bShareBand !== null) {
      ctx.addIssue({ code: 'custom', path: ['b2bShareBand'], message: 'B2B_SHARE_CONTEXT' });
    }
    if (profile.primaryCashFlowType === 'PRE_REVENUE') {
      if (profile.financingUseCase || profile.requestedAmountBand || profile.preferredTermBand) {
        ctx.addIssue({ code: 'custom', path: ['financingUseCase'], message: 'PRE_REVENUE_TERMS' });
      }
    } else if (
      !profile.financingUseCase ||
      !FINANCING_USES_BY_CASH_FLOW[profile.primaryCashFlowType].includes(
        profile.financingUseCase,
      ) ||
      !profile.requestedAmountBand ||
      !profile.preferredTermBand
    ) {
      ctx.addIssue({ code: 'custom', path: ['financingUseCase'], message: 'INCOMPLETE_PROFILE' });
    }
  });
export type BusinessFinancingProfileInput = z.infer<typeof businessFinancingProfileSchema>;
