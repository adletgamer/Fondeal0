import { redirect } from 'next/navigation';
import { adminEnv } from '../env';
import type { StaffRole, StaffStatus } from '../kyb/types';

export interface StaffSession {
  id: string;
  name: string;
  roles: readonly StaffRole[];
  status: StaffStatus;
  /** True only for the fixture identity used to review the design. */
  preview: boolean;
}

/**
 * Preview mode shows the screens with example data and a fixture identity, so
 * the design and flow can be used before staff authentication exists. It is on
 * wherever the environment is Testnet (local development, Vercel previews, or
 * `ADMIN_ENV=testnet`) and off in production. `ADMIN_PREVIEW_FIXTURES=0`
 * switches it off anywhere. It only ever serves the fictional fixtures.
 */
export function previewEnabled(): boolean {
  if (process.env.ADMIN_PREVIEW_FIXTURES === '0') return false;
  return adminEnv() === 'testnet';
}

const PREVIEW_STAFF: StaffSession = {
  id: 'preview-approver',
  name: 'Vista previa',
  roles: ['Approver'],
  status: 'Active',
  preview: true,
};

/**
 * Fail-closed identity lookup. Until staff authentication ships (docs/adr/0011,
 * increment 2) the only way in is preview mode; where it is off, this returns
 * `null` and every page redirects to /sign-in.
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  if (previewEnabled()) return PREVIEW_STAFF;
  return null;
}

/** Every protected page and action calls this first; the middleware is only a courtesy. */
export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) redirect('/sign-in');
  return session;
}
