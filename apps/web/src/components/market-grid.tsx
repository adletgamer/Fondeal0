'use client';

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

  return (
    <div>
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Filter width={16} height={16} />
          Filters
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Risk band</label>
            <div className="flex gap-1.5">
              {Object.values(RiskBand).map((band) => (
                <button
                  key={band}
                  type="button"
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
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Max term</label>
            <select
              className={selectClass}
              value={maxTermDays}
              onChange={(e) => setMaxTermDays(Number(e.target.value))}
            >
              <option value={90}>Up to 90 days</option>
              <option value={180}>Up to 180 days</option>
              <option value={365}>Up to 1 year</option>
              <option value={720}>Any term</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Min. APR</label>
            <select
              className={selectClass}
              value={minAprBps}
              onChange={(e) => setMinAprBps(Number(e.target.value))}
            >
              <option value={0}>Any</option>
              <option value={1000}>10%+</option>
              <option value={1500}>15%+</option>
              <option value={2000}>20%+</option>
              <option value={2500}>25%+</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Min. collateral
            </label>
            <select
              className={selectClass}
              value={minCollateralPct}
              onChange={(e) => setMinCollateralPct(Number(e.target.value))}
            >
              <option value={0}>Any</option>
              <option value={20}>20%+</option>
              <option value={50}>50%+</option>
              <option value={75}>75%+</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Sort by</label>
            <select
              className={selectClass}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">Newest</option>
              <option value="apr">Highest APR</option>
              <option value="risk">Lowest risk first</option>
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
          Only show opportunities still open for funding
        </label>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-8 py-14 text-center">
          <span className="text-lg font-semibold text-slate-900">No matches</span>
          <p className="max-w-sm text-sm text-slate-500">
            Nothing fits these filters right now. Widen the risk band or term to see more.
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
