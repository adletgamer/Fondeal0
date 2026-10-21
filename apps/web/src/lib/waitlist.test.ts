import { WaitlistCountry, WaitlistProfile } from '@fondealo/database';
import { describe, expect, it } from 'vitest';
import {
  WAITLIST_CONSENT_TEXT,
  WAITLIST_COUNTRIES,
  WAITLIST_COUNTRY_LABELS,
  WAITLIST_PROFILES,
  WAITLIST_PROFILE_LABELS,
} from './waitlist';

describe('waitlist options', () => {
  it('match the Prisma enums exactly, so the form can never submit an unknown value', () => {
    expect([...WAITLIST_PROFILES].sort()).toEqual(Object.values(WaitlistProfile).sort());
    expect([...WAITLIST_COUNTRIES].sort()).toEqual(Object.values(WaitlistCountry).sort());
  });

  it('have a Spanish label for every option', () => {
    for (const p of WAITLIST_PROFILES) expect(WAITLIST_PROFILE_LABELS[p]).toBeTruthy();
    for (const c of WAITLIST_COUNTRIES) expect(WAITLIST_COUNTRY_LABELS[c]).toBeTruthy();
  });

  it('never offer investment or promise returns', () => {
    const copy = [
      ...Object.values(WAITLIST_PROFILE_LABELS),
      ...Object.values(WAITLIST_COUNTRY_LABELS),
      WAITLIST_CONSENT_TEXT,
    ]
      .join(' ')
      .toLowerCase();
    for (const banned of ['invertir', 'inversión', 'retorno', 'rentabilidad', 'garantiz']) {
      expect(copy).not.toContain(banned);
    }
  });
});
