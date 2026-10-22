'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

/** The section links and account link below `lg`, where the inline nav is hidden. */
export function MobileNav({
  nav,
  navAria,
  open: openLabel,
  close: closeLabel,
  haveAccount,
  lang,
}: {
  nav: { href: string; label: string }[];
  navAria: string;
  open: string;
  close: string;
  haveAccount: string;
  /** Language switch, shown here only below `sm` where the header has no room for it. */
  lang: { href: string; label: string; code: string; aria: string };
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((o) => !o)}
        className="grid h-11 w-11 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="none">
          {open ? (
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
      <nav
        id={id}
        aria-label={navAria}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-surface-0 px-5 pb-4 pt-2 sm:px-8"
      >
        <ul>
          {nav.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center text-lg font-medium text-ink"
              >
                {n.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/onboarding"
              className="flex min-h-12 items-center text-lg font-medium text-ink-muted"
            >
              {haveAccount}
            </Link>
          </li>
          <li className="flex items-center gap-2 pt-1 sm:hidden">
            <a
              href={lang.href}
              hrefLang={lang.code}
              lang={lang.code}
              aria-label={lang.aria}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-ink-muted hover:bg-surface-200 hover:text-ink"
            >
              {lang.label}
            </a>
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </div>
  );
}
