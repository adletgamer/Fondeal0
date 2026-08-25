use soroban_sdk::{contracterror, contracttype, Address, BytesN};

/// Maximum credit reputation score. Scores are bounded to `0..=SCORE_MAX`.
pub const SCORE_MAX: u32 = 1000;

/// KYB (Know-Your-Business) lifecycle, mirroring the SEP-12 customer status model
/// so a real anchor/KYB provider can be dropped in later without changing the shape.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum KybStatus {
    /// No KYB on file yet.
    None = 0,
    /// Submitted, under review.
    Processing = 1,
    /// Approved — the business is eligible to hold a Passport.
    Accepted = 2,
    /// Rejected — not eligible.
    Rejected = 3,
}

/// Risk tier derived from the score. `A` is the lowest risk (best terms), `E` the highest.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RiskBand {
    A = 0,
    B = 1,
    C = 2,
    D = 3,
    E = 4,
}

/// The on-chain Business Passport: only trust-bearing facts live here.
/// PII / KYB documents live off-chain and are committed to via `data_hash`.
/// Read accessors are public so any Stellar contract can consume this trust primitive.
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Passport {
    pub kyb_status: KybStatus,
    /// Credit reputation score, `0..=SCORE_MAX`.
    pub score: u32,
    pub risk_band: RiskBand,
    /// Lifetime loans taken.
    pub loans_total: u32,
    /// Lifetime loans fully repaid.
    pub loans_repaid: u32,
    /// Consecutive on-time repayments.
    pub on_time_streak: u32,
    /// Ledger timestamp (unix seconds) of issuance.
    pub issued_at: u64,
    /// Ledger timestamp (unix seconds) of last mutation.
    pub updated_at: u64,
    /// Commitment (hash) to the off-chain KYB bundle.
    pub data_hash: BytesN<32>,
}

/// Storage keys. Roles live in instance storage; each Passport is a persistent
/// entry keyed by the business address.
///
/// Two write roles are intentionally separated:
/// - `Issuer` issues Passports and sets KYB status (the Fondealo backend / admin
///   key acting on an approved KYB).
/// - `RepManager` applies reputation updates — this is the `credit_score`
///   contract, which updates the Passport via a cross-contract call.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Issuer,
    RepManager,
    Passport(Address),
}

/// Contract error codes.
#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    PassportNotFound = 4,
    PassportAlreadyIssued = 5,
    InvalidScore = 6,
    NotAccepted = 7,
}
