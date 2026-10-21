import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * One shape for every action: flat fill, one radius, no shadow or glow at
 * rest. Hover shifts tone, press nudges down, focus is a solid ring that
 * meets 3:1 on every surface.
 */
const buttonVariants = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold',
    'transition-[background-color,color,border-color,transform] duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    'active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0',
    'disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress',
  ].join(' '),
  {
    variants: {
      variant: {
        // Dark text on emerald: white on emerald-600 was 3.77:1.
        primary: 'bg-brand-fill text-on-brand hover:bg-brand-hover',
        // Gold means money moving: fund, repay, withdraw.
        gold: 'bg-gold-fill text-on-gold hover:bg-gold-400',
        // Inverse of the page: night on Day, near-white on Night.
        dark: 'bg-ink text-surface-0 hover:bg-ink/85',
        secondary: 'bg-surface-200 text-ink hover:bg-surface-300',
        outline:
          'border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-surface-200',
        ghost: 'bg-transparent text-ink-muted hover:bg-surface-200 hover:text-ink',
        'ghost-light': 'bg-white/10 text-white hover:bg-white/20',
        // An action that reads as text, e.g. a secondary step next to a primary button.
        link: 'h-auto px-0 text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Shows a spinner and marks the button busy; the label stays for screen readers. */
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      aria-busy={loading || props['aria-busy'] || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  );
}

export { buttonVariants };
