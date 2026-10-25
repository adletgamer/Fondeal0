import { z } from 'zod';
import {
  businessFinancingProfileSchema,
  BUSINESS_FINANCING_PROFILE_VERSION,
  type BusinessFinancingProfileInput,
} from '@fondealo/types';
import { KYB_COUNTRIES, REVENUE_BANDS, SECTORS } from './providers/kyb';

export { BUSINESS_FINANCING_PROFILE_VERSION };
export const businessProfileInputSchema = z
  .object({
    legalName: z.string().trim().min(2).max(120),
    country: z.string().refine((value) => KYB_COUNTRIES.some((c) => c.name === value)),
    sector: z.enum(SECTORS),
    foundedYear: z.number().int().min(1900).max(new Date().getFullYear()),
    revenueBand: z.enum(REVENUE_BANDS).nullable(),
    profile: businessFinancingProfileSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.profile.primaryCashFlowType !== 'PRE_REVENUE' && !value.revenueBand) {
      ctx.addIssue({ code: 'custom', path: ['revenueBand'], message: 'REVENUE_REQUIRED' });
    }
  });

export type BusinessProfileInput = z.infer<typeof businessProfileInputSchema>;
export interface BusinessProfileInitial {
  legalName: string;
  country: string;
  sector: string;
  foundedYear: number | null;
  revenueBand: string | null;
  profile: BusinessFinancingProfileInput | null;
  identityLocked: boolean;
}
export type BusinessOnboardingState =
  | { kind: 'UNAVAILABLE'; initial: null }
  | { kind: 'NO_BUSINESS'; initial: null }
  | {
      kind: 'PROFILE_INCOMPLETE' | 'PROFILE_COMPLETE' | 'PRE_REVENUE';
      initial: BusinessProfileInitial;
    };
