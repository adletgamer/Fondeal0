import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const appDir = join(process.cwd(), 'src/app');
const source = (path: string) => readFileSync(join(appDir, path), 'utf8');

describe('route groups', () => {
  it('keeps the public landing out of the Privy layout', () => {
    expect(existsSync(join(appDir, '(public)/page.tsx'))).toBe(true);
    expect(existsSync(join(appDir, '(public)/en/page.tsx'))).toBe(true);
    expect(source('layout.tsx')).not.toMatch(/privy/i);
  });

  it('wraps the login and session routes in PrivyProviders', () => {
    expect(source('(app)/layout.tsx')).toContain('PrivyProviders');
    for (const route of ['onboarding', 'business', 'invest']) {
      expect(existsSync(join(appDir, '(app)', route))).toBe(true);
    }
  });
});
