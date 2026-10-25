import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_LOCALE_COOKIE, appTranslator } from './app-copy';
const state = vi.hoisted(() => ({ values: new Map<string, string>(), set: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (key: string) => (state.values.has(key) ? { value: state.values.get(key) } : undefined),
    set: state.set,
  }),
}));
const { getAppLocale } = await import('./app-locale');
const { setAppLocale } = await import('./actions/app-locale');
beforeEach(() => {
  vi.clearAllMocks();
  state.values.clear();
  state.set.mockImplementation((key: string, value: string) => state.values.set(key, value));
});
describe('dashboard language preference', () => {
  it('persists language independently of the verified identity cookie', async () => {
    state.values.set('fondealo_session', 'verified-test-session');
    expect(await getAppLocale()).toBe('es');
    expect(await setAppLocale('en')).toEqual({ ok: true });
    expect(await getAppLocale()).toBe('en');
    expect(state.set).toHaveBeenCalledWith(
      APP_LOCALE_COOKIE,
      'en',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 31536000 }),
    );
    expect(state.values.get('fondealo_session')).toBe('verified-test-session');
    await setAppLocale('es');
    expect(await getAppLocale()).toBe('es');
  });
  it('rejects unknown locales and ignores malformed stored preferences', async () => {
    expect(await setAppLocale('en<script>')).toEqual({ ok: false });
    expect(state.set).not.toHaveBeenCalled();
    state.values.set(APP_LOCALE_COOKIE, 'Investor');
    expect(await getAppLocale()).toBe('es');
  });
  it('translates dynamic operation feedback and preserves meaningful validation in both languages', () => {
    expect(appTranslator('es')('500 test USDC added to your balance.')).toContain(
      '500 USDC de prueba',
    );
    expect(appTranslator('en')('Continuar como {p0}', { p0: 'empresa' })).toBe(
      'Continue as business',
    );
    expect(appTranslator('en').error('Selecciona el sector de tu empresa.')).toBe(
      'Select your company’s sector.',
    );
    expect(appTranslator('es').error('raw provider error in an unsupported language')).toBe(
      'No pudimos completar la operación. Inténtalo de nuevo.',
    );
  });
});
