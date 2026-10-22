import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminEnv } from './env';

afterEach(() => vi.unstubAllEnvs());

const env = (vars: Record<string, string>) => {
  for (const k of ['NODE_ENV', 'ADMIN_ENV', 'VERCEL_ENV']) vi.stubEnv(k, vars[k] ?? '');
};

describe('adminEnv', () => {
  it('defaults to the strict policy on a production deployment', () => {
    env({ NODE_ENV: 'production', VERCEL_ENV: 'production' });
    expect(adminEnv()).toBe('production');
  });

  it('needs an explicit opt-in to use the Testnet policy on production', () => {
    env({ NODE_ENV: 'production', ADMIN_ENV: 'testnet' });
    expect(adminEnv()).toBe('testnet');
  });

  it('treats local development and Vercel previews as Testnet', () => {
    env({ NODE_ENV: 'development' });
    expect(adminEnv()).toBe('testnet');
    env({ NODE_ENV: 'production', VERCEL_ENV: 'preview' });
    expect(adminEnv()).toBe('testnet');
  });

  it('ignores unknown values', () => {
    env({ NODE_ENV: 'production', ADMIN_ENV: 'staging' });
    expect(adminEnv()).toBe('production');
  });
});
