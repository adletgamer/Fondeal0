'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { truncateAddress } from '@fondealo/ui';
import { clearSession } from '@/lib/actions/session';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import { Wallet } from './icons';
import { APP_NAVIGATION, activeAppHref, type AppRole } from './app-navigation';
import styles from './app-shell.module.css';
import {
  AppLanguageSwitch,
  AppLocaleProvider,
  useAppLocale,
  useAppTranslation,
} from './app-locale-provider';
import type { AppLocale } from '@/lib/app-copy';

export function AppShell({
  locale = 'es',
  ...props
}: {
  locale?: AppLocale;
  role: AppRole;
  address: string;
  children: ReactNode;
}) {
  return (
    <AppLocaleProvider locale={locale}>
      <LocalizedAppShell {...props} />
    </AppLocaleProvider>
  );
}

function LocalizedAppShell({
  role,
  address,
  children,
}: {
  role: AppRole;
  address: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = usePrivy();
  const t = useAppTranslation();
  const locale = useAppLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const activeHref = activeAppHref(role, pathname);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        document.getElementById('app-menu-toggle')?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  async function handleLogout() {
    setLogoutError(false);
    try {
      await logout();
      await clearSession();
      router.replace('/');
      router.refresh();
    } catch {
      setLogoutError(true);
    }
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#app-content">
        {t('Skip to content')}
      </a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link
            href={role === 'Business' ? '/business' : '/invest'}
            aria-label={t(role === 'Business' ? 'Business home' : 'Investor home')}
            className={styles.brand}
          >
            <Logo priority />
          </Link>
          <span className={styles.role}>{t(role)}</span>
          <nav
            id="app-navigation"
            aria-label={t(role === 'Business' ? 'Business navigation' : 'Investor navigation')}
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
          >
            {APP_NAVIGATION[role].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={activeHref === href ? 'page' : undefined}
                className={`${styles.navLink} ${activeHref === href ? styles.navLinkActive : ''}`}
              >
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className={styles.actions}>
            <AppLanguageSwitch />
            <span className={styles.themeControl}>
              <ThemeToggle locale={locale} />
            </span>
            <button
              type="button"
              className={styles.account}
              onClick={handleLogout}
              title={`${address} — ${t('Sign out')}`}
              aria-label={`${t('Sign out')} ${address}`}
            >
              <Wallet width={16} height={16} aria-hidden="true" />
              <span className={styles.address}>{truncateAddress(address)}</span>
              <span className={styles.logoutLabel}>{t('Sign out')}</span>
            </button>
            <button
              type="button"
              id="app-menu-toggle"
              className={styles.menuButton}
              aria-label={t(menuOpen ? 'Close navigation' : 'Open navigation')}
              aria-controls="app-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>
        {logoutError ? (
          <p className={styles.error} role="alert">
            {t('Could not sign out. Please try again.')}
          </p>
        ) : null}
      </header>
      <div id="app-content" className={styles.content} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
