import type { ReactNode } from 'react';
import { cn } from '@fondealo/ui';

export function Panel({
  id,
  title,
  aside,
  className,
  children,
}: {
  id: string;
  title: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('rounded-2xl bg-surface-100 p-5 sm:p-6', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
