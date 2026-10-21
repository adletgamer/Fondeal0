import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Surfaces are told apart by a step in tone, not by shadows: a resting card
 * never casts one. `interactive` cards lift their border and tone on hover.
 */
const cardVariants = cva('rounded-2xl text-ink transition-colors duration-150', {
  variants: {
    variant: {
      default: 'border border-line bg-surface-100',
      muted: 'bg-surface-200',
      outline: 'border border-line-strong/50 bg-transparent',
    },
    interactive: {
      true: 'hover:border-line-strong hover:bg-surface-200/60 motion-reduce:transition-none',
      false: '',
    },
  },
  defaultVariants: { variant: 'default', interactive: false },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  /** The one selected or actively-funding item in a view: brand border and ring. */
  live?: boolean;
}

export function Card({ className, live, variant, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ variant, interactive }),
        live && 'border-brand-line ring-1 ring-brand-line',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-display text-lg font-semibold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-ink-muted', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export { cardVariants };
