import { cookies } from 'next/headers';
import { APP_LOCALE_COOKIE, appTranslator, type AppLocale } from './app-copy';

export async function getAppLocale(): Promise<AppLocale> {
  return (await cookies()).get(APP_LOCALE_COOKIE)?.value === 'en' ? 'en' : 'es';
}

export async function getAppTranslator() {
  return appTranslator(await getAppLocale());
}
