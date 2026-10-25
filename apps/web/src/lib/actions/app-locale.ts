'use server';

import { cookies } from 'next/headers';
import { APP_LOCALE_COOKIE } from '@/lib/app-copy';

/** Presentation preference only. Never modifies the identity/session cookie or account role. */
export async function setAppLocale(locale: string): Promise<{ ok: boolean }> {
  if (locale !== 'es' && locale !== 'en') return { ok: false };
  (await cookies()).set(APP_LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true };
}
