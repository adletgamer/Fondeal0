import { describe, expect, it } from 'vitest';
import { REASON_CODES, reasonCode, reasonsFor } from './reason-codes';

describe('reason codes', () => {
  it('have unique codes', () => {
    expect(new Set(REASON_CODES.map((r) => r.code)).size).toBe(REASON_CODES.length);
  });

  it('offer at least one option for each decision that needs a reason', () => {
    expect(reasonsFor('Reject').length).toBeGreaterThan(1);
    expect(reasonsFor('RequestInformation').length).toBeGreaterThan(1);
    expect(reasonCode('POLICY_MET')?.kind).toBe('Approve');
  });

  it('every “other” code demands an explanation', () => {
    for (const r of REASON_CODES.filter((r) => r.code.startsWith('OTHER_'))) {
      expect(r.needsNote).toBe(true);
    }
  });

  it('messages for the business carry no personal data, no figures and no financing promise', () => {
    for (const r of REASON_CODES) {
      expect(r.userMessage, r.code).not.toMatch(/\d/);
      expect(r.userMessage.length, r.code).toBeLessThanOrEqual(160);
      expect(r.userMessage.toLowerCase(), r.code).not.toMatch(
        /garantiz|préstamo|crédito|puntaje|rentabilidad|retorno/,
      );
    }
  });

  it('the approval message says it is not a financing approval', () => {
    expect(reasonCode('POLICY_MET')?.userMessage).toContain(
      'no es una aprobación de financiamiento',
    );
  });
});
