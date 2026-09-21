import Link from 'next/link';
import { Container } from '@fondealo/ui';
import { Logo } from './icons';
import { PrivyAuthButton } from './privy-auth-button';

const NAV_LINKS = [
  ['/#how', 'How it works'],
  ['/#passport', 'Passport'],
  ['/#compose', 'Composability'],
  ['/business', 'For businesses'],
  ['/invest', 'Invest'],
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="Fondealo home" className="text-slate-900">
          <Logo />
        </Link>
        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex"
        >
          {NAV_LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <details className="group relative md:hidden">
            <summary
              aria-label="Open menu"
              className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 [&::-webkit-details-marker]:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft"
            >
              {NAV_LINKS.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </details>
          <PrivyAuthButton />
        </div>
      </Container>
    </header>
  );
}
