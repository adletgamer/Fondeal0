import type { AdminEnv } from './kyb/types';

/**
 * Which environment's policy applies. Fails closed: in a production build the
 * stricter policy applies unless `ADMIN_ENV=testnet` is set explicitly.
 */
export function adminEnv(): AdminEnv {
  const v = process.env.ADMIN_ENV;
  if (v === 'testnet' || v === 'production') return v;
  return process.env.NODE_ENV === 'production' ? 'production' : 'testnet';
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
