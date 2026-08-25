import { z } from 'zod';
import { riskBandSchema } from './passport';

/** Lifecycle of a funding opportunity (loan request). */
export const OpportunityStatus = {
  Draft: 'Draft',
  Open: 'Open',
  Funded: 'Funded',
  Active: 'Active',
  Repaid: 'Repaid',
  Defaulted: 'Defaulted',
  Cancelled: 'Cancelled',
} as const;
export type OpportunityStatus = (typeof OpportunityStatus)[keyof typeof OpportunityStatus];
export const opportunityStatusSchema = z.nativeEnum(OpportunityStatus);

/** All monetary amounts are USDC, expressed in stroops (1 USDC = 10_000_000). */
export const USDC_DECIMALS = 7;
export const USDC_STROOPS = 10 ** USDC_DECIMALS;

export const opportunitySchema = z.object({
  id: z.string(),
  business: z.string(),
  title: z.string().min(1),
  description: z.string().default(''),
  /** Requested principal in USDC stroops. */
  amount: z.string(), // bigint-as-string to avoid precision loss
  /** Total funded so far, USDC stroops. */
  funded: z.string(),
  /** Loan term in days. */
  termDays: z.number().int().positive(),
  /** Annual interest rate in basis points (e.g. 1800 = 18%). */
  aprBps: z.number().int().nonnegative(),
  /** Risk band at creation, drives the suggested APR. */
  riskBand: riskBandSchema,
  status: opportunityStatusSchema,
  createdAt: z.number().int().nonnegative(),
});
export type Opportunity = z.infer<typeof opportunitySchema>;

export const fundingSchema = z.object({
  id: z.string(),
  opportunityId: z.string(),
  investor: z.string(),
  amount: z.string(),
  createdAt: z.number().int().nonnegative(),
});
export type Funding = z.infer<typeof fundingSchema>;

export const repaymentSchema = z.object({
  id: z.string(),
  opportunityId: z.string(),
  amount: z.string(),
  onTime: z.boolean(),
  isFinal: z.boolean(),
  createdAt: z.number().int().nonnegative(),
});
export type Repayment = z.infer<typeof repaymentSchema>;
