'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { appTranslator, type AppLocale } from '@/lib/app-copy';
import { setAppLocale } from '@/lib/actions/app-locale';

const LocaleContext = createContext<AppLocale>('es');
export const useAppLocale = () => useContext(LocaleContext);
export const useAppTranslation = () => appTranslator(useAppLocale());

export function AppLocaleProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [locale]);
  return (
    <LocaleContext.Provider value={locale}>
      <div lang={locale}>{children}</div>
    </LocaleContext.Provider>
  );
}

export function AppLanguageSwitch() {
  const locale = useAppLocale();
  const t = useAppTranslation();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="relative shrink-0">
      <div
        role="group"
        aria-label={t('Change language')}
        className="flex rounded-full border border-current/20 p-0.5 text-sm"
      >
        {(['es', 'en'] as const).map((value) => (
          <button
            key={value}
            type="button"
            lang={value}
            aria-label={value === 'es' ? 'Español' : 'English'}
            aria-pressed={locale === value}
            disabled={pending || locale === value}
            className={`min-h-11 min-w-11 rounded-full px-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${locale === value ? 'bg-brand-fill text-on-brand' : 'hover:bg-white/10'}`}
            onClick={() =>
              startTransition(async () => {
                setError(false);
                try {
                  const result = await setAppLocale(value);
                  if (!result.ok) {
                    setError(true);
                    return;
                  }
                  router.refresh();
                } catch {
                  setError(true);
                }
              })
            }
          >
            {value.toUpperCase()}
          </button>
        ))}
      </div>
      {error ? (
        <p
          role="alert"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg bg-danger-soft p-3 text-sm text-danger-text"
        >
          {t('Could not change language. Please try again.')}
        </p>
      ) : null}
    </div>
  );
}
