'use client';
import Link from 'next/link';
import { AppLanguageSwitch, useAppLocale, useAppTranslation } from './app-locale-provider';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import styles from './navbar.module.css';

const NAV_LINKS = [
  ['/#senales', 'Passport'],
  ['/#red', 'Access'],
  ['/#estado', 'Availability'],
  ['/#preguntas', 'FAQ'],
] as const;

/** Public navigation for onboarding and reference pages; the landing has its own editorial header. */
export function Navbar() {
  const t = useAppTranslation();
  const locale = useAppLocale();
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" aria-label={t('Fondealo home')} className={styles.brand}>
          <Logo priority />
        </Link>
        <nav aria-label={t('Explore Fondealo')} className={styles.desktopNav}>
          {NAV_LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={styles.link}>
              {t(label)}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <AppLanguageSwitch />
          <span className={styles.themeControl}>
            <ThemeToggle locale={locale} />
          </span>
          <details className={styles.mobileMenu}>
            <summary aria-label={t('Open navigation')} className={styles.menuTrigger}>
              <span aria-hidden="true">☰</span>
            </summary>
            <nav aria-label={t('Explore Fondealo')} className={styles.mobileNav}>
              {NAV_LINKS.map(([href, label]) => (
                <Link key={href} href={href} className={styles.link}>
                  {t(label)}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
