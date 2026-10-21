/**
 * Dates as a Peruvian business reads them. Server components render in UTC,
 * so without an explicit zone an evening event in Lima shows as the next day.
 */
export function formatDateLima(
  value: Date | string | number,
  dateStyle: 'short' | 'medium' | 'long' = 'medium',
): string {
  return new Date(value).toLocaleDateString('es-PE', { timeZone: 'America/Lima', dateStyle });
}
