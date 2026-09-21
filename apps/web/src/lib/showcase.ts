import { KybStatus, RiskBand, type Passport } from '@fondealo/types';

/** Demo credential used on the landing page (not real data). */
export const SHOWCASE_PASSPORT: Passport = {
  business: 'GBODEGA4LIMAX7YQ2K9WESTELLARDEMOADDR000000000000000000000',
  kybStatus: KybStatus.Accepted,
  score: 720,
  riskBand: RiskBand.B,
  loansTotal: 8,
  loansRepaid: 8,
  onTimeStreak: 8,
  issuedAt: 1_735_689_600,
  updatedAt: 1_772_323_200,
  dataHash: '0x…',
};
