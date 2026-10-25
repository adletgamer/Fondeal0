'use client';
import { useAppLocale, useAppTranslation } from './app-locale-provider';
import Link from 'next/link';
import { Card, RiskBadge } from '@fondealo/ui';
import { maxProtectedPct, requiredCollateral, type Opportunity } from '@fondealo/types';
import { Building, ShieldCheck } from './icons';

/** The marketplace's central unit: editorial hierarchy, funding progress, and
 * the collateral coverage that backs the §2 risk/return model. */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const t = useAppTranslation();
  const locale = useAppLocale();

  const pct = Math.round((Number(opportunity.funded) / Number(opportunity.amount)) * 100);
  const collateral = requiredCollateral(opportunity.amount, opportunity.riskBand);
  const protectedPct = maxProtectedPct(opportunity.riskBand);

  return (
    <Link href={`/invest/opportunity/${opportunity.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-6 transition-shadow hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <RiskBadge band={opportunity.riskBand} locale={locale} />
          <span className="text-xs font-medium text-slate-400">{t(opportunity.status)}</span>
        </div>

        <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-tight text-slate-900">
          {opportunity.title}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
          <Building width={13} height={13} />
          <span className="truncate font-mono">{opportunity.business}</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold leading-none tracking-tight text-slate-900">
            {(opportunity.aprBps / 100).toLocaleString(t('__locale'), {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </span>
          <div className="pb-0.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {t('APR')}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {t('over')} {opportunity.termDays} {t('days')}
            </div>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-700">
          <ShieldCheck width={13} height={13} />
          {protectedPct}
          {t('% collateral-protected')}
          <span className="text-slate-400">
            ({Number(collateral).toLocaleString(t('__locale'))} {t('USDC locked)')}
          </span>
        </div>

        <div className="mt-4 flex-1" />

        <div className="border-t border-slate-100 pt-3.5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-slate-700">
              {Number(opportunity.funded).toLocaleString(t('__locale'))} {t('USDC raised')}
            </span>
            <span className="text-slate-400">
              {t('of')} {Number(opportunity.amount).toLocaleString(t('__locale'))}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
