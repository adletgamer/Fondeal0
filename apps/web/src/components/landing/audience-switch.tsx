'use client';

import { useState } from 'react';
import { buttonVariants, cn } from '@fondealo/ui';
import type { Locale } from './content';

type AudienceCopy = {
  aria: string;
  startup: string;
  funder: string;
  startupCopy: string;
  funderCopy: string;
  startupCta: string;
  funderCta: string;
  startupNote: string;
  funderNote: string;
};

export function AudienceSwitch({ copy, locale }: { copy: AudienceCopy; locale: Locale }) {
  const [audience, setAudience] = useState<'startup' | 'funder'>('startup');
  const funder = audience === 'funder';

  return (
    <div className="landing-fade mt-6">
      <div
        role="group"
        aria-label={copy.aria}
        className="inline-flex rounded-full border border-line bg-surface-100 p-1"
      >
        {(['startup', 'funder'] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={audience === key}
            onClick={() => setAudience(key)}
            className={cn(
              'min-h-10 rounded-full px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none',
              audience === key ? 'bg-ink text-surface-0' : 'text-ink-muted hover:text-ink',
            )}
          >
            {copy[key]}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-4 max-w-[34rem] text-lg leading-snug text-ink-muted">
        {funder ? copy.funderCopy : copy.startupCopy}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <a href={funder ? '#red-confianza' : '#lista'} className={buttonVariants({ size: 'xl' })}>
          {funder ? copy.funderCta : copy.startupCta}
        </a>
        <a href="#financiadores" className={buttonVariants({ variant: 'link', size: 'lg' })}>
          {locale === 'en' ? 'See the permission flow' : 'Ver el flujo de permisos'}
        </a>
      </div>
      <p className="mt-5 max-w-[34rem] text-sm leading-normal text-ink-muted">
        {funder ? copy.funderNote : copy.startupNote}
      </p>
    </div>
  );
}
