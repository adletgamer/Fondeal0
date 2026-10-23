import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge, cn } from '@fondealo/ui';
import { CAPABILITIES } from '@/lib/env';
import type { AdminEnv } from '@/lib/kyb/types';
import type { StaffSession } from '@/lib/auth/staff';
import { ROLE_LABEL } from '@/lib/kyb/authz';

const NAV = [
  { href: '/', label: 'Cola de revisión', ready: true },
  { label: 'Decisiones', ready: false },
  { label: 'Auditoría', ready: false },
  { label: 'Personal', ready: false },
] as const;

/** The frame of every signed-in page: identity, environment, and honest status. */
export function Shell({
  staff,
  env,
  active = '/',
  children,
}: {
  staff: StaffSession;
  env: AdminEnv;
  active?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-line bg-surface-100 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
          <div>
            <p className="font-brand text-lg font-semibold tracking-tight">Fondealo</p>
            <p className="text-[13px] text-ink-muted">Administración</p>
          </div>
        </div>
        <nav
          aria-label="Secciones"
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0"
        >
          {NAV.map((item) =>
            item.ready ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active === item.href ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors',
                  active === item.href
                    ? 'bg-surface-200 text-ink'
                    : 'text-ink-muted hover:bg-surface-200/60 hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg px-3 text-sm text-ink-faint"
              >
                {item.label}
                <span className="text-[13px]">Pronto</span>
              </span>
            ),
          )}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" dot="static">
              {env === 'testnet' ? 'Testnet' : 'Producción'}
            </Badge>
            {staff.preview ? <Badge variant="info">Datos de ejemplo</Badge> : null}
          </div>
          <p className="text-sm text-ink-muted">
            {staff.name} · {staff.roles.map((r) => ROLE_LABEL[r]).join(', ')}
          </p>
        </header>

        {!CAPABILITIES.persistsDecisions ? (
          <p
            role="note"
            className="border-b border-line bg-info-soft px-5 py-2.5 text-sm text-info-text sm:px-8"
          >
            Vista previa: las decisiones aún no se guardan y no se emite ningún Pasaporte.
          </p>
        ) : null}

        <main id="main" className="px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
