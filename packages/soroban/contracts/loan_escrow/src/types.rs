use business_passport::RiskBand;
use soroban_sdk::{contracterror, contracttype, Address};

/// Reputation-adjusted collateral ratio, in basis points of principal.
/// MUST match `COLLATERAL_CONFIG_V1` in `packages/types/src/collateral.ts` and
/// docs/product-v2.md §2 exactly: A 20%, B 35%, C 50%, D 75%, E 100%.
pub fn collateral_ratio_bps(band: RiskBand) -> i128 {
    match band {
        RiskBand::A => 2000,
        RiskBand::B => 3500,
        RiskBand::C => 5000,
        RiskBand::D => 7500,
        RiskBand::E => 10000,
    }
}

/// Lifecycle of a funding opportunity held by this escrow.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum OpportunityStatus {
    /// Collateral locked; accepting investor funding.
    Open = 0,
    /// Fully funded; awaiting release of principal to the business.
    Funded = 1,
    /// Principal released to the business; loan is live.
    Active = 2,
    /// Fully repaid: investors paid, collateral returned, score updated.
    Repaid = 3,
    /// Defaulted after due + grace: collateral (and any partial repayment)
    /// seized pro-rata to investors, score penalized.
    Defaulted = 4,
}

/// One funding opportunity. Amounts are USDC (the SAC token configured at
/// `init`), in the token's native `i128` unit (stroops).
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Opportunity {
    pub business: Address,
    pub principal: i128,
    pub collateral_amount: i128,
    pub apr_bps: u32,
    pub term_days: u32,
    /// USDC pulled from investors so far. Capped at `principal`.
    pub funded: i128,
    /// USDC pulled from the business so far, toward `total_due`.
    pub repaid: i128,
    pub status: OpportunityStatus,
    /// Unix seconds the loan is due. Set when `release` is called
    /// (the clock starts when the business actually receives the money).
    pub due_at: u64,
}

/// Storage keys. Roles live in instance storage; each opportunity and its
/// investor shares are persistent entries keyed by the caller-supplied id.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// Address of the deployed `business_passport` contract.
    Passport,
    /// Address of the deployed `credit_score` contract.
    Score,
    /// USDC Stellar Asset Contract address.
    Token,
    /// Address allowed to call `default` after due + grace.
    Keeper,
    Opportunity(u64),
    /// Per-opportunity map of investor address -> amount funded.
    Shares(u64),
}

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    OpportunityNotFound = 3,
    OpportunityAlreadyExists = 4,
    PassportNotFound = 5,
    /// `collateral_amount` didn't equal `principal * collateralRatio(band)`.
    CollateralMismatch = 6,
    /// The call isn't valid for the opportunity's current status.
    InvalidStatus = 7,
    /// `amount` is zero, negative, or otherwise out of range.
    InvalidAmount = 8,
    /// `fund` would push `funded` past `principal`.
    OverFunding = 9,
    /// `repay` would push `repaid` past the total amount due.
    RepaymentExceedsDue = 10,
    /// `default` called before `due_at` + the grace period.
    NotYetDue = 11,
}
