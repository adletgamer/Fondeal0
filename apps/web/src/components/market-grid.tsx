'use client';
import { useAppTranslation } from './app-locale-provider';

import { useMemo, useState } from 'react';
import { Card } from '@fondealo/ui';
import { maxProtectedPct, RiskBand, type Opportunity } from '@fondealo/types';
import { OpportunityCard } from './opportunity-card';
import { Filter } from './icons';

type SortKey = 'apr' | 'risk' | 'newest';

const RISK_ORDER: Record<RiskBand, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

export function MarketGrid({ opportunities }: { opportunities: Opportunity[] }) {
  const t = useAppTranslation();

  const [bands, setBands] = useState<Set<RiskBand>>(new Set(Object.values(RiskBand)));
  const [maxTermDays, setMaxTermDays] = useState<number>(720);
  const [minAprBps, setMinAprBps] = useState<number>(0);
  const [minCollateralPct, setMinCollateralPct] = useState<number>(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');

  const filtered = useMemo(() => {
    const rows = opportunities.filter((o) => {
      if (!bands.has(o.riskBand)) return false;
      if (o.termDays > maxTermDays) return false;
      if (o.aprBps < minAprBps) return false;
      if (maxProtectedPct(o.riskBand) < minCollateralPct) return false;
      if (openOnly && o.status !== 'Open') return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      if (sort === 'apr') return b.aprBps - a.aprBps;
      if (sort === 'risk') return RISK_ORDER[a.riskBand] - RISK_ORDER[b.riskBand];
      return b.createdAt - a.createdAt;
    });
  }, [opportunities, bands, maxTermDays, minAprBps, minCollateralPct, openOnly, sort]);

  function toggleBand(band: RiskBand) {
    setBands((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  }

  function resetFilters() {
    setBands(new Set(Object.values(RiskBand)));
    setMaxTermDays(720);
    setMinAprBps(0);
    setMinCollateralPct(0);
    setOpenOnly(false);
    setSort('newest');
  }

  return (
    <div>
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter width={16} height={16} />
          {t('Filters')}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p id="market-risk-bands" className="mb-1.5 block text-xs font-medium text-slate-600">
              {t('Risk band')}
            </p>
            <div role="group" aria-labelledby="market-risk-bands" className="flex gap-1.5">
              {Object.values(RiskBand).map((band) => (
                <button
                  key={band}
                  type="button"
                  aria-pressed={bands.has(band)}
                  aria-label={`${t('Risk band')} ${band}`}
                  onClick={() => toggleBand(band)}
                  className={`h-8 w-8 rounded-lg border text-sm font-semibold transition-colors ${
                    bands.has(band)
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {band}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="market-term"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              {t('Max term')}
            </label>
            <select
              id="market-term"
              className={selectClass}
              value={maxTermDays}
              onChange={(e) => setMaxTermDays(Number(e.target.value))}
            >
              <option value={90}>{t('Up to 90 days')}</option>
              <option value={180}>{t('Up to 180 days')}</option>
              <option value={365}>{t('Up to 1 year')}</option>
              <option value={720}>{t('Any term')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="market-apr" className="mb-1.5 block text-xs font-medium text-slate-600">
              {t('Min. APR')}
            </label>
            <select
              id="market-apr"
              className={selectClass}
              value={minAprBps}
              onChange={(e) => setMinAprBps(Number(e.target.value))}
            >
              <option value={0}>{t('Any')}</option>
              <option value={1000}>10%+</option>
              <option value={1500}>15%+</option>
              <option value={2000}>20%+</option>
              <option value={2500}>25%+</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="market-collateral"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              {t('Min. collateral')}
            </label>
            <select
              id="market-collateral"
              className={selectClass}
              value={minCollateralPct}
              onChange={(e) => setMinCollateralPct(Number(e.target.value))}
            >
              <option value={0}>{t('Any')}</option>
              <option value={20}>20%+</option>
              <option value={50}>50%+</option>
              <option value={75}>75%+</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="market-sort"
              className="mb-1.5 block text-xs font-medium text-slate-600"
            >
              {t('Sort by')}
            </label>
            <select
              id="market-sort"
              className={selectClass}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">{t('Newest')}</option>
              <option value="apr">{t('Highest APR')}</option>
              <option value="risk">{t('Lowest risk first')}</option>
            </select>
          </div>
        </div>

        <label className="mt-4 flex w-fit items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          {t('Only show opportunities still open for funding')}
        </label>
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p role="status" className="text-ink-muted">
          {filtered.length === 1
            ? t('Showing one scenario')
            : t('Showing {count} scenarios', { count: filtered.length })}
        </p>
        <button
          type="button"
          onClick={resetFilters}
          className="min-h-11 font-semibold text-brand-text hover:underline"
        >
          {t('Reset filters')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-8 py-14 text-center">
          <span className="text-lg font-semibold text-slate-900">{t('No matches')}</span>
          <p className="max-w-sm text-sm text-slate-500">
            {t('Nothing fits these filters right now. Widen the risk band or term to see more.')}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}
    </div>
  );
}
