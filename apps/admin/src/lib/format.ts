const DAY_MS = 86_400_000;

/** `20612345678` becomes `206••••5678`; short values are fully hidden. */
export function maskTaxId(taxId: string): string {
  if (taxId.length < 8) return '•'.repeat(taxId.length);
  return `${taxId.slice(0, 3)}${'•'.repeat(taxId.length - 7)}${taxId.slice(-4)}`;
}

/** Whole days between `iso` and `now`, never negative. */
export function daysSince(iso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

export function ageLabel(iso: string, now: Date): string {
  const d = daysSince(iso, now);
  if (d === 0) return 'hoy';
  if (d === 1) return 'hace 1 día';
  return `hace ${d} días`;
}

/** Lima time on every server, so the same case never shows two dates. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}
