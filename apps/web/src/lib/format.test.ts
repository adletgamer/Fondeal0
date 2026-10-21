import { describe, expect, it } from 'vitest';
import { formatDateLima } from './format';

describe('formatDateLima', () => {
  it('uses Lima time, not the server UTC date', () => {
    // 02:00 UTC on 2 Oct is still 21:00 on 1 Oct in Lima (UTC−5).
    expect(formatDateLima('2026-10-02T02:00:00Z', 'long')).toMatch(/^1 de octubre de 2026$/);
  });
});
