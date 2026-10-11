import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Investor' | 'Business' | null;
  },
  market: vi.fn(),
  detail: vi.fn(),
  passport: vi.fn(),
  theme: vi.fn(),
  wallet: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));
vi.mock('@/lib/auth/session', () => ({ getSession: async () => state.session }));
vi.mock('@/lib/data/opportunities', () => ({
  getMarketOpportunities: state.market,
  getOpportunityDetail: state.detail,
  getBorrowerPassport: state.passport,
}));
vi.mock('@/lib/data/passport-theme', () => ({ getPassportTheme: state.theme }));
vi.mock('@/lib/wallet/ledger', () => ({ getWalletSummary: state.wallet }));
vi.mock('@fondealo/ui', () => ({ Badge: () => null, Card: () => null, Container: () => null }));
vi.mock('@/components/section-tabs', () => ({ SectionTabs: () => null }));
vi.mock('@/components/data-source-badge', () => ({ DataSourceBadge: () => null }));
vi.mock('@/components/market-grid', () => ({ MarketGrid: () => null }));
vi.mock('@/components/risk-disclosure', () => ({ RiskDisclosure: () => null }));
vi.mock('@/components/passport-v2', () => ({ PassportV2: () => null }));
vi.mock('@/components/fund-panel', () => ({ FundPanel: () => null }));
vi.mock('@/components/icons', () => ({ Calendar: () => null, ShieldCheck: () => null }));

const { default: MarketPage } = await import('./market/page');
const { default: OpportunityDetailPage } = await import('./opportunity/[id]/page');
const detailParams = { params: Promise.resolve({ id: 'private-opportunity' }) };

beforeEach(() => {
  state.session = null;
  vi.clearAllMocks();
});

describe('investor pages', () => {
  it.each([
    ['market', () => MarketPage()],
    ['opportunity detail', () => OpportunityDetailPage(detailParams)],
  ])('%s denies absent or invalid sessions before any data access', async (_name, render) => {
    await expect(render()).rejects.toThrow('REDIRECT:/onboarding');
    expect(state.market).not.toHaveBeenCalled();
    expect(state.detail).not.toHaveBeenCalled();
    expect(state.passport).not.toHaveBeenCalled();
    expect(state.theme).not.toHaveBeenCalled();
    expect(state.wallet).not.toHaveBeenCalled();
  });

  it.each([
    ['market', () => MarketPage()],
    ['opportunity detail', () => OpportunityDetailPage(detailParams)],
  ])('%s denies a Business role before any data access', async (_name, render) => {
    state.session = { privyUserId: 'user', stellarAddress: 'GBUSINESS', role: 'Business' };
    await expect(render()).rejects.toThrow('REDIRECT:/business');
    expect(state.market).not.toHaveBeenCalled();
    expect(state.detail).not.toHaveBeenCalled();
  });

  it('continues to load the marketplace for a verified investor', async () => {
    state.session = { privyUserId: 'user', stellarAddress: 'GINVESTOR', role: 'Investor' };
    state.market.mockResolvedValue({ source: 'demo', opportunities: [] });
    await expect(MarketPage()).resolves.toBeTruthy();
    expect(state.market).toHaveBeenCalledOnce();
  });
});
