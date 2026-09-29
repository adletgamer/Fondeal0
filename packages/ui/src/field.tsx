import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';

// line-strong borders meet 3:1 on every surface; focus is the solid ring.
const fieldControlClass =
  'w-full rounded-lg border border-line-strong bg-surface-100 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-focus-ring focus:outline-none focus:ring-2 focus:ring-focus-ring/40 aria-[invalid=true]:border-danger-text';

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  /** Replaces the hint with an error message and marks the control invalid. */
  error?: ReactNode;
  className?: string;
}

function FieldShell({
  label,
  hint,
  error,
  hintId,
  className,
  children,
}: FieldShellProps & { hintId: string; children: ReactNode }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
      {error ? (
        <span id={hintId} className="text-xs text-danger-text">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="text-xs text-ink-faint">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function controlA11y(hintId: string, hint: ReactNode, error: ReactNode) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || hint ? hintId : undefined,
  } as const;
}

export function Field({
  label,
  hint,
  error,
  unit,
  mono,
  className,
  inputClassName,
  ...props
}: FieldShellProps & {
  /** Asset code shown inside the control, e.g. "USDC". */
  unit?: string;
  /** Ledger data (addresses, contract ids, amounts): monospace. */
  mono?: boolean;
  inputClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const hintId = useId();
  const input = (
    <input
      {...props}
      {...controlA11y(hintId, hint, error)}
      className={cn(
        fieldControlClass,
        (mono || unit) && 'font-mono tabular-nums',
        unit && 'pr-16',
        inputClassName,
      )}
    />
  );
  return (
    <FieldShell label={label} hint={hint} error={error} hintId={hintId} className={className}>
      {unit ? (
        <span className="relative block">
          {input}
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-medium text-gold-text">
            {unit}
          </span>
        </span>
      ) : (
        input
      )}
    </FieldShell>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  ...props
}: FieldShellProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const hintId = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} hintId={hintId} className={className}>
      <textarea {...props} {...controlA11y(hintId, hint, error)} className={fieldControlClass} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  children,
  ...props
}: FieldShellProps & { children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const hintId = useId();
  return (
    <FieldShell label={label} hint={hint} error={error} hintId={hintId} className={className}>
      <select {...props} {...controlA11y(hintId, hint, error)} className={fieldControlClass}>
        {children}
      </select>
    </FieldShell>
  );
}
