import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStaffSession, previewEnabled } from './staff';

afterEach(() => vi.unstubAllEnvs());

describe('staff session (fail closed)', () => {
  it('has no session by default', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '');
    expect(previewEnabled()).toBe(false);
    expect(await getStaffSession()).toBeNull();
  });

  it('shows the preview identity only when asked, in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '1');
    expect(await getStaffSession()).toMatchObject({ preview: true, role: 'Approver' });
  });

  it('can never be enabled in a production build', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_PREVIEW_FIXTURES', '1');
    expect(previewEnabled()).toBe(false);
    expect(await getStaffSession()).toBeNull();
  });
});
