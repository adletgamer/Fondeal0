import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        brand: 'border-brand-200 bg-brand-50 text-brand-700',
        gold: 'border-gold-300/60 bg-gold-50 text-gold-600',
        neutral: 'border-slate-200 bg-slate-50 text-slate-600',
        outline: 'border-white/15 bg-white/5 text-slate-200',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
