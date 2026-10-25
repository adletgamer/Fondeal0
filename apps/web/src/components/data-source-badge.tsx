'use client';
import { Badge } from '@fondealo/ui';
import { useAppTranslation } from './app-locale-provider';
import type { DataSource } from '@/lib/data/opportunities';

const LABEL: Record<DataSource, string> = {
  chain: 'En vivo — Testnet',
  database: 'Datos de prueba guardados',
  demo: 'Datos de demostración',
};

const VARIANT: Record<DataSource, 'brand' | 'gold' | 'neutral'> = {
  chain: 'brand',
  database: 'gold',
  demo: 'neutral',
};

/** Tells the viewer exactly which tier answered — never claims to be live when it isn't. */
export function DataSourceBadge({ source }: { source: DataSource }) {
  const t = useAppTranslation();
  return <Badge variant={VARIANT[source]}>{t(LABEL[source])}</Badge>;
}
