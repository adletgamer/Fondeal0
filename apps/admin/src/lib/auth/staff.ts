import { redirect } from 'next/navigation';
import type { StaffRole } from '../kyb/types';

export interface StaffSession {
  id: string;
  name: string;
  role: StaffRole;
  /** True only for the fixture identity used to review the design. */
  preview: boolean;
}

/**
 * Preview mode shows the screens with example data and a fixture identity so
 * the design and flow can be reviewed before staff authentication exists. It
 * cannot be switched on in a production build, whatever the variable says.
 */
export function previewEnabled(): boolean {
  return process.env.ADMIN_PREVIEW_FIXTURES === '1' && process.env.NODE_ENV !== 'production';
}

const PREVIEW_STAFF: StaffSession = {
  id: 'preview-approver',
  name: 'Vista previa',
  role: 'Approver',
  preview: true,
};

/**
 * Fail-closed identity lookup. Until staff authentication ships (docs/adr/0011,
 * increment 2) the only way in is preview mode in development; everywhere else
 * this returns `null` and every page redirects to /sign-in.
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
