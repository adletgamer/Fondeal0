import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        // Dark text on emerald: white on emerald-600 was 3.77:1.
        primary: 'bg-brand-fill text-on-brand shadow-soft hover:bg-brand-hover hover:shadow-glow',
        // Gold means money moving: fund, repay, withdraw.
        gold: 'bg-gold-fill text-on-gold shadow-soft hover:bg-gold-400',
        // Inverse of the page: night on Day, near-white on Night.
        dark: 'bg-ink text-surface-0 hover:bg-ink/85',
        secondary: 'bg-surface-200 text-ink hover:bg-surface-300',
        outline:
          'border border-line-strong bg-transparent text-ink hover:border-brand-text hover:text-brand-text',
        ghost: 'bg-transparent text-ink-muted hover:bg-surface-200 hover:text-ink',
        'ghost-light': 'bg-white/10 text-white backdrop-blur hover:bg-white/20',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
