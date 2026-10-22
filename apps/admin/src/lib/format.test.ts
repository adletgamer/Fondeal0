import { describe, expect, it } from 'vitest';
import { ageLabel, daysSince, formatDateTime, maskTaxId } from './format';

describe('maskTaxId', () => {
  it('keeps the first three and last four digits', () => {
    expect(maskTaxId('20612345678')).toBe('206••••5678');
  });
  it('hides short values entirely', () => {
    expect(maskTaxId('1234')).toBe('••••');
  });
});

describe('age', () => {
  const now = new Date('2026-10-22T15:00:00Z');
  it('counts whole days and never goes negative', () => {
    expect(daysSince('2026-10-19T15:00:00Z', now)).toBe(3);
    expect(daysSince('2026-10-25T15:00:00Z', now)).toBe(0);
  });
  it('speaks plainly', () => {
    expect(ageLabel('2026-10-22T10:00:00Z', now)).toBe('hoy');
    expect(ageLabel('2026-10-21T10:00:00Z', now)).toBe('hace 1 día');
    expect(ageLabel('2026-10-17T10:00:00Z', now)).toBe('hace 5 días');
  });
  it('shows Lima time', () => {
    expect(formatDateTime('2026-10-22T03:30:00Z')).toContain('22:30');
  });
});
