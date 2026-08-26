import { Badge } from '@fondealo/ui';
import type { DataSource } from '@/lib/data/opportunities';

const LABEL: Record<DataSource, string> = {
  chain: 'Live — Testnet',
  database: 'Live — Phase 6 backend',
  demo: 'Demo data',
};

const VARIANT: Record<DataSource, 'brand' | 'gold' | 'neutral'> = {
  chain: 'brand',
  database: 'gold',
  demo: 'neutral',
};

/** Tells the viewer exactly which tier answered — never claims to be live when it isn't. */
export function DataSourceBadge({ source }: { source: DataSource }) {
  return <Badge variant={VARIANT[source]}>{LABEL[source]}</Badge>;
}
