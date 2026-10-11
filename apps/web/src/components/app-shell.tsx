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

export function AppShell({
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const activeHref = activeAppHref(role, pathname);

  useEffect(() => setMenuOpen(false), [pathname]);

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
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link
            href={role === 'Business' ? '/business' : '/invest'}
            aria-label={`${role} dashboard`}
            className={styles.brand}
          >
            <Logo priority />
          </Link>
          <span className={styles.role}>{role === 'Business' ? 'Business' : 'Investor'}</span>
          <nav
            id="app-navigation"
            aria-label={`${role} navigation`}
            className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}
          >
            {APP_NAVIGATION[role].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={activeHref === href ? 'page' : undefined}
                className={`${styles.navLink} ${activeHref === href ? styles.navLinkActive : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className={styles.actions}>
            <span className={styles.themeControl}>
              <ThemeToggle />
            </span>
            <button
              type="button"
              className={styles.account}
              onClick={handleLogout}
              title={`${address} — log out`}
              aria-label={`Log out of ${address}`}
            >
              <Wallet width={16} height={16} aria-hidden="true" />
              <span className={styles.address}>{truncateAddress(address)}</span>
              <span className={styles.logoutLabel}>Log out</span>
            </button>
            <button
              type="button"
              className={styles.menuButton}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
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
            Could not log out. Please try again.
          </p>
        ) : null}
      </header>
      <div id="app-content" className={styles.content} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
