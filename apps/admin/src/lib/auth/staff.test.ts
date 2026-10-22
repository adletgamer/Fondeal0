import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStaffSession, previewEnabled } from './staff';

afterEach(() => vi.unstubAllEnvs());

const env = (vars: Record<string, string>) => {
  for (const k of ['NODE_ENV', 'ADMIN_ENV', 'ADMIN_PREVIEW_FIXTURES', 'VERCEL_ENV']) {
    vi.stubEnv(k, vars[k] ?? '');
  }
};

describe('staff session', () => {
  it('opens the preview in development without any setup', async () => {
    env({ NODE_ENV: 'development' });
    expect(previewEnabled()).toBe(true);
    expect(await getStaffSession()).toMatchObject({
      preview: true,
      roles: ['Approver'],
      status: 'Active',
    });
  });

  it('opens the preview on Vercel preview deployments', async () => {
    env({ NODE_ENV: 'production', VERCEL_ENV: 'preview' });
    expect(previewEnabled()).toBe(true);
  });

  it('opens the preview where the environment is explicitly Testnet', async () => {
    env({ NODE_ENV: 'production', ADMIN_ENV: 'testnet' });
    expect(previewEnabled()).toBe(true);
  });

  it('stays closed in production, and the old flag does not override that', async () => {
    env({ NODE_ENV: 'production', VERCEL_ENV: 'production', ADMIN_PREVIEW_FIXTURES: '1' });
    expect(previewEnabled()).toBe(false);
    expect(await getStaffSession()).toBeNull();
    env({ NODE_ENV: 'production', ADMIN_ENV: 'production', ADMIN_PREVIEW_FIXTURES: '1' });
    expect(await getStaffSession()).toBeNull();
  });

  it('can be switched off anywhere with ADMIN_PREVIEW_FIXTURES=0', async () => {
    env({ NODE_ENV: 'development', ADMIN_PREVIEW_FIXTURES: '0' });
    expect(previewEnabled()).toBe(false);
    expect(await getStaffSession()).toBeNull();
  });
});
