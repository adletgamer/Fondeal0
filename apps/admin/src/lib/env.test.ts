import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminEnv } from './env';

afterEach(() => vi.unstubAllEnvs());

describe('adminEnv', () => {
  it('defaults to the strict policy in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ENV', '');
    expect(adminEnv()).toBe('production');
  });

  it('needs an explicit opt-in to use the Testnet policy in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ENV', 'testnet');
    expect(adminEnv()).toBe('testnet');
  });

  it('ignores unknown values', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_ENV', 'staging');
    expect(adminEnv()).toBe('production');
  });
});
