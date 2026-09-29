import type { ReactNode } from 'react';
import { cn } from './cn';

export type TxState = 'pending' | 'confirmed' | 'failed';

const STATE: Record<TxState, { label: string; tone: string }> = {
  pending: { label: 'Submitted', tone: 'text-info-text' },
  confirmed: { label: 'Confirmed', tone: 'text-brand-text' },
  failed: { label: 'Failed', tone: 'text-danger-text' },
};

export interface TxStatusProps {
  state: TxState;
  /** Overrides the default state word ("Submitted", "Confirmed", "Failed"). */
  label?: string;
  /** Hash, ledger or result code, shown in the ledger face. */
  meta?: ReactNode;
  /** Explorer link or retry action, right-aligned. */
  action?: ReactNode;
  className?: string;
}

/**
 * Where a Soroban transaction is. Every state has an icon and a word — colour
 * never carries the meaning alone. Place it under the button that sent it.
 */
export function TxStatus({ state, label, meta, action, className }: TxStatusProps) {
  const s = STATE[state];
  return (
    <div
      role={state === 'failed' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line bg-surface-100 px-4 py-3',
        className,
      )}
    >
      <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold', s.tone)}>
        <TxIcon state={state} />
        {label ?? s.label}
      </span>
      {meta ? (
        <span className="min-w-0 break-all font-mono text-xs text-ink-faint">{meta}</span>
      ) : null}
      {action ? (
        <span className="ml-auto text-xs font-medium text-brand-text">{action}</span>
      ) : null}
    </div>
  );
}

function TxIcon({ state }: { state: TxState }) {
  if (state === 'pending') {
    return (
      <span
        aria-hidden
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
      />
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      {state === 'confirmed' ? (
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M9.5 9.5l5 5m0-5l-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
