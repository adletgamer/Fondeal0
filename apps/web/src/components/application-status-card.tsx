import { Card } from '@fondealo/ui';
import {
  NOT_A_FINANCING_PROMISE,
  type ApplicationStatus,
  type StepState,
} from '@/lib/application-status';
import { Check } from './icons';

const TONE: Record<ApplicationStatus['tone'], string> = {
  neutral: 'border-slate-200',
  info: 'border-brand-200 bg-brand-50',
  warning: 'border-amber-200 bg-amber-50',
  success: 'border-emerald-200 bg-emerald-50',
  danger: 'border-red-200 bg-red-50',
};

const STEP_SUFFIX: Record<StepState, string> = {
  done: 'completado',
  current: 'en curso',
  upcoming: 'pendiente',
  blocked: 'no aprobado',
};

function StepDot({ state, index }: { state: StepState; index: number }) {
  const base = 'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold';
  if (state === 'done')
    return (
      <span className={`${base} bg-brand-fill text-on-brand`} aria-hidden>
        <Check width={12} height={12} />
      </span>
    );
  if (state === 'blocked')
    return (
      <span className={`${base} bg-red-600 text-white`} aria-hidden>
        ×
      </span>
    );
  return (
    <span
      className={`${base} ${state === 'current' ? 'bg-ink text-surface-0' : 'bg-slate-200 text-slate-600'}`}
      aria-hidden
    >
      {index + 1}
    </span>
  );
}

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

/**
 * Where the application stands and the one next step. Renders the same on
 * the dashboard (compact) and the verification page.
 */
export function ApplicationStatusCard({
  status,
  compact = false,
  showAction = true,
  className = '',
}: {
  status: ApplicationStatus;
  compact?: boolean;
  showAction?: boolean;
  className?: string;
}) {
  return (
    <Card className={`p-5 sm:p-6 ${TONE[status.tone]} ${className}`}>
      <section aria-labelledby="application-status-title" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Estado de tu solicitud
        </p>
        <h2
          id="application-status-title"
          className="mt-1 font-display text-xl font-bold text-slate-900"
        >
          {status.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-700">{status.body}</p>

        {status.steps && !compact ? (
          <ol className="mt-5 grid gap-3 sm:grid-cols-4" aria-label="Etapas de la verificación">
            {status.steps.map((step, i) => (
              <li
                key={step.key}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className="flex items-center gap-2 text-sm"
              >
                <StepDot state={step.state} index={i} />
                <span
                  className={
                    step.state === 'upcoming' ? 'text-slate-600' : 'font-medium text-slate-900'
                  }
                >
                  {step.label}
                  <span className="sr-only"> ({STEP_SUFFIX[step.state]})</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {showAction && status.action ? (
          <a
            href={status.action.href}
            className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-surface-0 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {status.action.label}
          </a>
        ) : null}

        <p className="mt-4 text-xs text-slate-600">{NOT_A_FINANCING_PROMISE}</p>
        {SUPPORT_EMAIL ? (
          <p className="mt-1 text-xs text-slate-600">
            ¿Dudas sobre tu solicitud? Escríbenos a{' '}
            <a className="font-medium underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        ) : null}
      </section>
    </Card>
  );
}
