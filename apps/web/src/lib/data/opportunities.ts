import { prisma } from '@fondealo/database';
import { EscrowClient, PassportClient } from '@fondealo/sdk';
import { COLLATERAL_CONFIG_V1, KybStatus, RiskBand, type Opportunity, type Passport } from '@fondealo/types';

/**
 * Three-tier read layer for the investor/business screens: try the deployed
 * `loan_escrow` contract first (via @fondealo/sdk's EscrowClient), fall back
 * to the Postgres projection, and only fall back to clearly-labeled demo data
 * if neither is available. `source` tells the UI which tier actually
 * answered, so nothing ever claims to be live when it isn't.
 *
 * Today `EscrowClient` always throws (no Testnet contract id is configured
 * yet — see docs/product-v2.md Prompt 3/6), so the chain tier is exercised
 * but never actually reachable until deploy. Title/description are
 * intentionally off-chain-only UX metadata (docs/architecture.md), so a
 * chain-sourced row cannot carry them — this is fine because that path can't
 * be reached before Prompt 6 wires real indexing anyway.
 */
export type DataSource = 'chain' | 'database' | 'demo';

export interface PositionView {
  opportunityId: string;
  title: string;
  business: string;
  investorAmount: string;
  principal: string;
  funded: string;
  aprBps: number;
  termDays: number;
  riskBand: RiskBand;
  status: Opportunity['status'];
  createdAt: number;
}

const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'demo-1',
    business: 'GBODEGA…LIMA',
    title: 'Inventory financing — bodega, Lima',
    description: 'Restock for high season.',
    amount: '5000',
    funded: '3200',
    termDays: 90,
    aprBps: 1800,
    riskBand: RiskBand.B,
    status: 'Open',
    createdAt: 1_766_000_000,
  },
  {
    id: 'demo-2',
    business: 'GTALLER…BOG',
    title: 'Equipment loan — taller, Bogotá',
    description: 'New machine.',
    amount: '12000',
    funded: '12000',
    termDays: 180,
    aprBps: 2200,
    riskBand: RiskBand.C,
    status: 'Funded',
    createdAt: 1_765_000_000,
  },
  {
    id: 'demo-3',
    business: 'GTIENDA…CDMX',
    title: 'Working capital — tienda, CDMX',
    description: 'Bridge for receivables.',
    amount: '8000',
    funded: '2100',
    termDays: 120,
    aprBps: 2000,
    riskBand: RiskBand.B,
    status: 'Open',
    createdAt: 1_766_500_000,
  },
  {
    id: 'demo-4',
    business: 'GFARMA…SAO',
    title: 'Seasonal stock — farmácia, São Paulo',
    description: 'Higher-risk, newly onboarded business.',
    amount: '3000',
    funded: '0',
    termDays: 60,
    aprBps: 3200,
    riskBand: RiskBand.E,
    status: 'Open',
    createdAt: 1_767_000_000,
  },
];

const DEMO_POSITIONS: PositionView[] = [
  {
    opportunityId: 'demo-2',
    title: 'Equipment loan — taller, Bogotá',
    business: 'GTALLER…BOG',
    investorAmount: '4000',
    principal: '12000',
    funded: '12000',
    aprBps: 2200,
    termDays: 180,
    riskBand: RiskBand.C,
    status: 'Funded',
    createdAt: 1_765_000_000,
  },
  {
    opportunityId: 'demo-1',
    title: 'Inventory financing — bodega, Lima',
    business: 'GBODEGA…LIMA',
    investorAmount: '1200',
    principal: '5000',
    funded: '3200',
    aprBps: 1800,
    termDays: 90,
    riskBand: RiskBand.B,
    status: 'Open',
    createdAt: 1_766_000_000,
  },
];

const DEMO_PASSPORT: Passport = {
  business: 'GBODEGA…LIMA',
  kybStatus: KybStatus.Accepted,
  score: 640,
  riskBand: RiskBand.C,
  loansTotal: 3,
  loansRepaid: 3,
  onTimeStreak: 3,
  issuedAt: 1_760_000_000,
  updatedAt: 1_766_000_000,
  dataHash: '0x…',
};

function tryEscrowClient(): EscrowClient | null {
  try {
    return new EscrowClient();
  } catch {
    return null;
  }
}

function tryPassportClient(): PassportClient | null {
  try {
    return new PassportClient();
  } catch {
    return null;
  }
}

/** Reverse-derive the risk band from an on-chain ratio (chain doesn't store the band itself). */
function bandFromCollateralRatio(collateralAmount: string, principal: string): RiskBand {
  const p = BigInt(principal || '0');
  if (p === 0n) return RiskBand.C;
  const ratioBps = Number((BigInt(collateralAmount || '0') * 10_000n) / p);
  const match = Object.values(RiskBand).find(
    (band) => COLLATERAL_CONFIG_V1[band].collateralRatioBps === ratioBps,
  );
  return match ?? RiskBand.C;
}

async function chainOpportunities(): Promise<Opportunity[] | null> {
  const escrow = tryEscrowClient();
  if (!escrow) return null;
  try {
    const rows = await escrow.listOpportunities();
    if (rows.length === 0) return null;
    return rows.map((o) => ({
      id: o.opportunityId,
      business: o.business,
      title: `On-chain opportunity #${o.opportunityId}`,
      description: '',
      amount: o.principal,
      funded: o.funded,
      termDays: o.termDays,
      aprBps: o.aprBps,
      riskBand: bandFromCollateralRatio(o.collateralAmount, o.principal),
      status: o.status,
      createdAt: 0,
    }));
  } catch {
    return null;
  }
}

async function databaseOpportunities(): Promise<Opportunity[] | null> {
  try {
    const rows = await prisma.opportunity.findMany({
      where: { status: { in: ['Open', 'Funded', 'Active'] } },
      orderBy: { createdAt: 'desc' },
      take: 24,
      include: { business: true },
    });
    if (rows.length === 0) return null;
    return rows.map((row) => ({
      id: row.id,
      business: row.business.stellarAddress,
      title: row.title,
      description: row.description,
      amount: row.amount,
      funded: row.funded,
      termDays: row.termDays,
      aprBps: row.aprBps,
      riskBand: row.riskBand,
      status: row.status,
      createdAt: Math.floor(row.createdAt.getTime() / 1000),
    }));
  } catch {
    return null;
  }
}

/** The investor marketplace grid. Tries chain, then database, then demo. */
export async function getMarketOpportunities(): Promise<{
  source: DataSource;
  opportunities: Opportunity[];
}> {
  const chain = await chainOpportunities();
  if (chain) return { source: 'chain', opportunities: chain };

  const db = await databaseOpportunities();
  if (db) return { source: 'database', opportunities: db };

  return { source: 'demo', opportunities: DEMO_OPPORTUNITIES };
}

/** One opportunity's detail. Tries chain, then database, then demo (by id). */
export async function getOpportunityDetail(
  id: string,
): Promise<{ source: DataSource; opportunity: Opportunity | null }> {
  const escrow = tryEscrowClient();
  if (escrow) {
    try {
      const onchain = await escrow.getOpportunity(id);
      if (onchain) {
        return {
          source: 'chain',
          opportunity: {
            id: onchain.opportunityId,
            business: onchain.business,
            title: `On-chain opportunity #${onchain.opportunityId}`,
            description: '',
            amount: onchain.principal,
            funded: onchain.funded,
            termDays: onchain.termDays,
            aprBps: onchain.aprBps,
            riskBand: bandFromCollateralRatio(onchain.collateralAmount, onchain.principal),
            status: onchain.status,
            createdAt: 0,
          },
        };
      }
    } catch {
      // fall through to database
    }
  }

  try {
    const row = await prisma.opportunity.findUnique({ where: { id }, include: { business: true } });
    if (row) {
      return {
        source: 'database',
        opportunity: {
          id: row.id,
          business: row.business.stellarAddress,
          title: row.title,
          description: row.description,
          amount: row.amount,
          funded: row.funded,
          termDays: row.termDays,
          aprBps: row.aprBps,
          riskBand: row.riskBand,
          status: row.status,
          createdAt: Math.floor(row.createdAt.getTime() / 1000),
        },
      };
    }
  } catch {
    // fall through to demo
  }

  const demo = DEMO_OPPORTUNITIES.find((o) => o.id === id) ?? null;
  return { source: 'demo', opportunity: demo };
}

/** An investor's funding positions, by Stellar address. Tries chain, then database, then demo. */
export async function getInvestorPositions(
  address: string,
): Promise<{ source: DataSource; positions: PositionView[] }> {
  const escrow = tryEscrowClient();
  if (escrow) {
    try {
      const chainPositions = await escrow.getPositions(address);
      if (chainPositions.length > 0) {
        const withOpportunities = await Promise.all(
          chainPositions.map(async (pos) => {
            const o = await escrow.getOpportunity(pos.opportunityId);
            return o
              ? {
                  opportunityId: pos.opportunityId,
                  title: `On-chain opportunity #${pos.opportunityId}`,
                  business: o.business,
                  investorAmount: pos.amount,
                  principal: o.principal,
                  funded: o.funded,
                  aprBps: o.aprBps,
                  termDays: o.termDays,
                  riskBand: bandFromCollateralRatio(o.collateralAmount, o.principal),
                  status: o.status,
                  createdAt: 0,
                }
              : null;
          }),
        );
        const positions = withOpportunities.filter((p): p is PositionView => p !== null);
        if (positions.length > 0) return { source: 'chain', positions };
      }
    } catch {
      // fall through to database
    }
  }

  try {
    const fundings = await prisma.funding.findMany({
      where: { investor: address },
      include: { opportunity: { include: { business: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (fundings.length > 0) {
      return {
        source: 'database',
        positions: fundings.map((f) => ({
          opportunityId: f.opportunityId,
          title: f.opportunity.title,
          business: f.opportunity.business.stellarAddress,
          investorAmount: f.amount,
          principal: f.opportunity.amount,
          funded: f.opportunity.funded,
          aprBps: f.opportunity.aprBps,
          termDays: f.opportunity.termDays,
          riskBand: f.opportunity.riskBand,
          status: f.opportunity.status,
          createdAt: Math.floor(f.createdAt.getTime() / 1000),
        })),
      };
    }
  } catch {
    // fall through to demo
  }

  return { source: 'demo', positions: DEMO_POSITIONS };
}

/** A business's own opportunities (every status), by Stellar address. */
export async function getBusinessOpportunities(
  address: string,
): Promise<{ source: DataSource; opportunities: Opportunity[] }> {
  try {
    const business = await prisma.business.findUnique({
      where: { stellarAddress: address },
      include: { opportunities: { orderBy: { createdAt: 'desc' } } },
    });
    if (business && business.opportunities.length > 0) {
      return {
        source: 'database',
        opportunities: business.opportunities.map((row) => ({
          id: row.id,
          business: address,
          title: row.title,
          description: row.description,
          amount: row.amount,
          funded: row.funded,
          termDays: row.termDays,
          aprBps: row.aprBps,
          riskBand: row.riskBand,
          status: row.status,
          createdAt: Math.floor(row.createdAt.getTime() / 1000),
        })),
      };
    }
  } catch {
    // fall through to demo
  }

  // Only ever show demo opportunities that actually belong to the requested
  // demo address — never another demo business's loans on your dashboard.
  return {
    source: 'demo',
    opportunities: DEMO_OPPORTUNITIES.filter((o) => o.business === address),
  };
}

/** Sum of everything repaid so far on one opportunity (off-chain projection only). */
export async function getRepaidSoFar(opportunityId: string): Promise<number> {
  try {
    const rows = await prisma.repayment.findMany({
      where: { opportunityId },
      select: { amount: true },
    });
    return rows.reduce((sum, r) => sum + Number(r.amount), 0);
  } catch {
    return 0;
  }
}

/**
 * A business's Passport, by Stellar address. Tries the deployed
 * `business_passport` contract, then the Postgres `PassportProjection`
 * mirror (not written by any code path yet, so this tier is currently
 * always empty — kept for when Phase 4's app wiring lands), then demo.
 */
export async function getBorrowerPassport(
  address: string,
): Promise<{ source: DataSource; passport: Passport }> {
  const client = tryPassportClient();
  if (client) {
    try {
      const passport = await client.get(address);
      if (passport) return { source: 'chain', passport };
    } catch {
      // fall through to database
    }
  }

  try {
    const projection = await prisma.passportProjection.findFirst({
      where: { business: { stellarAddress: address } },
    });
    if (projection) {
      return {
        source: 'database',
        passport: {
          business: address,
          kybStatus: projection.kybStatus,
          score: projection.score,
          riskBand: projection.riskBand,
          loansTotal: projection.loansTotal,
          loansRepaid: projection.loansRepaid,
          onTimeStreak: projection.onTimeStreak,
          issuedAt: Math.floor(projection.issuedAt.getTime() / 1000),
          updatedAt: Math.floor(projection.updatedAt.getTime() / 1000),
          dataHash: projection.dataHash,
        },
      };
    }
  } catch {
    // fall through to demo
  }

  return { source: 'demo', passport: { ...DEMO_PASSPORT, business: address } };
}
