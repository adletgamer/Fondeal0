import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        // Verified / healthy.
        brand: 'border-brand-line bg-brand-soft text-brand-text',
        // Yield, amounts, USDC.
        gold: 'border-gold-text/40 bg-gold-soft text-gold-text',
        // Protocol names and plain tags.
        neutral: 'border-line bg-surface-200 text-ink-muted',
        // Pending transaction.
        info: 'border-info-text/40 bg-info-soft text-info-text',
        // Failed or overdue. The word carries the meaning; colour reinforces it.
        danger: 'border-danger-text/40 bg-danger-soft text-danger-text',
        // On dark islands (hero bands).
        outline: 'border-white/15 bg-white/5 text-slate-200',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /** A leading status dot in the badge's colour; `live` pulses (a live network). */
  dot?: 'static' | 'live';
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
          {dot === 'live' ? (
            <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
          ) : null}
          <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export { badgeVariants };
