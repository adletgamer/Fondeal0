import Link from 'next/link';
import { Card } from '@fondealo/ui';
import { maxProtectedPct, requiredCollateral, type Opportunity } from '@fondealo/types';
import { Building, ShieldCheck } from './icons';

// Semantic signal, not decoration: border + text in one solid tone on a
// neutral (white) surface — no tinted fill.
const BAND_COLOR: Record<string, string> = {
  A: 'text-brand-700 border-brand-300',
  B: 'text-brand-700 border-brand-300',
  C: 'text-gold-600 border-gold-400',
  D: 'text-orange-600 border-orange-300',
  E: 'text-red-600 border-red-300',
};

/** The marketplace's central unit: editorial hierarchy, funding progress, and
 * the collateral coverage that backs the §2 risk/return model. */
export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const pct = Math.round((Number(opportunity.funded) / Number(opportunity.amount)) * 100);
  const collateral = requiredCollateral(opportunity.amount, opportunity.riskBand);
  const protectedPct = maxProtectedPct(opportunity.riskBand);

  return (
    <Link href={`/invest/opportunity/${opportunity.id}`} className="block h-full">
      <Card className="flex h-full flex-col p-6 transition-shadow hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`rounded-full border bg-white px-2.5 py-1 text-xs font-semibold ${BAND_COLOR[opportunity.riskBand] ?? ''}`}
          >
            Risk {opportunity.riskBand}
          </span>
          <span className="text-xs font-medium text-slate-400">{opportunity.status}</span>
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
            {(opportunity.aprBps / 100).toFixed(1)}%
          </span>
          <div className="pb-0.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              APR
            </div>
            <div className="text-xs font-medium text-slate-500">
              over {opportunity.termDays} days
            </div>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-700">
          <ShieldCheck width={13} height={13} />
          {protectedPct}% collateral-protected
          <span className="text-slate-400">
            ({Number(collateral).toLocaleString()} USDC locked)
          </span>
        </div>

        <div className="mt-4 flex-1" />

        <div className="border-t border-slate-100 pt-3.5">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-medium text-slate-700">
              {Number(opportunity.funded).toLocaleString()} USDC raised
            </span>
            <span className="text-slate-400">of {Number(opportunity.amount).toLocaleString()}</span>
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
