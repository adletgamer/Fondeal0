import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/** Centered content column with consistent horizontal padding. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-6', className)} {...props} />;
}
