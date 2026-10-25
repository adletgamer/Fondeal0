/**
 * Dates as a Peruvian business reads them. Server components render in UTC,
 * so without an explicit zone an evening event in Lima shows as the next day.
 */
export function formatDateLima(
  value: Date | string | number,
  dateStyle: 'short' | 'medium' | 'long' = 'medium',
  locale = 'es-PE',
): string {
  return new Date(value).toLocaleDateString(locale, { timeZone: 'America/Lima', dateStyle });
}
