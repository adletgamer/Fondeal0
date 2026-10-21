import Link from 'next/link';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';
import styles from './navbar.module.css';

const NAV_LINKS = [
  ['/#idea', 'La idea'],
  ['/#passport', 'Pasaporte'],
  ['/#reputation', 'Reputación'],
  ['/#status', 'Estado'],
] as const;

/** Public navigation for onboarding and reference pages; the landing has its own editorial header. */
export function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" aria-label="Fondealo, inicio" className={styles.brand}>
          <Logo priority />
        </Link>
        <nav aria-label="Explorar Fondealo" className={styles.desktopNav}>
          {NAV_LINKS.map(([href, label]) => (
            <Link key={href} href={href} className={styles.link}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <span className={styles.themeControl}>
            <ThemeToggle />
          </span>
          <details className={styles.mobileMenu}>
            <summary aria-label="Abrir navegación" className={styles.menuTrigger}>
              <span aria-hidden="true">☰</span>
            </summary>
            <nav aria-label="Explorar Fondealo en móvil" className={styles.mobileNav}>
              {NAV_LINKS.map(([href, label]) => (
                <Link key={href} href={href} className={styles.link}>
                  {label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
