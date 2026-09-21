import { describe, expect, it } from 'vitest';
import {
  KybStatus,
  RiskBand,
  passportHistoryMonths,
  reputationLayers,
  type Passport,
} from './passport';

const base: Passport = {
  business: 'GBODEGA',
  kybStatus: KybStatus.Accepted,
  score: 720,
  riskBand: RiskBand.B,
  loansTotal: 8,
  loansRepaid: 8,
  onTimeStreak: 8,
  issuedAt: 1_735_689_600, // 2025-01-01
  updatedAt: 1_772_323_200, // 2026-03-01
  dataHash: '0x',
};

const byId = (p: Passport) => Object.fromEntries(reputationLayers(p).map((l) => [l.id, l.value]));

describe('passportHistoryMonths', () => {
  it('rounds the issuance→update span to whole months', () => {
    expect(passportHistoryMonths(base)).toBe(14);
  });
  it('never goes negative', () => {
    expect(passportHistoryMonths({ issuedAt: 100, updatedAt: 50 })).toBe(0);
  });
});

describe('reputationLayers', () => {
  it('returns the four layers in ring order', () => {
    expect(reputationLayers(base).map((l) => l.id)).toEqual([
      'identity',
      'repayment',
      'activity',
      'longevity',
    ]);
  });
  it('scores a strong, verified business', () => {
    expect(byId(base)).toEqual({ identity: 100, repayment: 100, activity: 80, longevity: 58 });
  });
  it('gives a brand-new unverified business empty layers', () => {
    const fresh = {
      ...base,
      kybStatus: KybStatus.None,
      loansTotal: 0,
      loansRepaid: 0,
      updatedAt: base.issuedAt,
    };
    expect(byId(fresh)).toEqual({ identity: 0, repayment: 0, activity: 0, longevity: 0 });
  });
  it('rates KYB in review at half', () => {
    expect(byId({ ...base, kybStatus: KybStatus.Processing }).identity).toBe(50);
  });
  it('caps activity and longevity at 100', () => {
    const big = { ...base, loansTotal: 40, loansRepaid: 20, updatedAt: base.issuedAt + 10 ** 9 };
    expect(byId(big)).toMatchObject({ repayment: 50, activity: 100, longevity: 100 });
  });
});
