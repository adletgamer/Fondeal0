import type { AdminEnv, SeparationMode } from './kyb/types';

/**
 * Which environment's policy applies. Fails closed: a production deployment
 * gets the strict policy unless `ADMIN_ENV=testnet` is set explicitly. Local
 * development and Vercel preview deployments count as Testnet.
 */
export function adminEnv(): AdminEnv {
  const v = process.env.ADMIN_ENV;
  if (v === 'testnet' || v === 'production') return v;
  if (process.env.VERCEL_ENV === 'preview') return 'testnet';
  return process.env.NODE_ENV === 'production' ? 'production' : 'testnet';
}

/**
 * Maker-checker is always enforced in production. On Testnet a single operator
 * may prepare and decide the same case (`solo`, the default there) until a
 * second person joins; `ADMIN_SEPARATION_OF_DUTIES=enforced` turns it on.
 */
export function separationMode(): SeparationMode {
  if (adminEnv() === 'production') return 'enforced';
  return process.env.ADMIN_SEPARATION_OF_DUTIES === 'enforced' ? 'enforced' : 'solo';
}

/**
 * What the back-office really does at this point. The UI reads these so its
 * copy never promises more than the code does. Flip each as its increment ships.
 */
export const CAPABILITIES = {
  authenticatesStaff: false,
  persistsDecisions: false,
  queuesPassportIssuance: false,
} as const;
