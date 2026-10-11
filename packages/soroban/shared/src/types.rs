use soroban_sdk::{contracterror, contracttype, Address, BytesN, String, Symbol};

/// Maximum credit reputation score. Scores are bounded to `0..=SCORE_MAX`.
pub const SCORE_MAX: u32 = 1000;

/// Longest `metadata_uri` accepted, in bytes. The URI points at *off-chain*,
/// non-credit identity metadata (display name, theme, pattern); it is capped so
/// the persistent entry stays small and cheap to keep alive.
pub const MAX_METADATA_URI_LEN: u32 = 256;

/// Most credentials a single Passport can carry. Bounds storage growth and the
/// cost of `credentials()`.
pub const MAX_CREDENTIALS: u32 = 16;

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

/// Lifecycle of a Passport. Non-transferable credentials still need a way to be
/// suspended (investigation, expired KYB) or withdrawn (fraud) — ownership never
/// moves, only this status does.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PassportStatus {
    /// Normal operation.
    Active = 0,
    /// Temporarily suspended by the issuer: still readable, but reputation and
    /// metadata cannot change and no credentials can be added. Reversible.
    Frozen = 1,
    /// Permanently withdrawn by the issuer. Terminal.
    Revoked = 2,
}

/// Lifecycle of a single credential attached to a Passport.
#[contracttype]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CredentialStatus {
    Active = 0,
    /// Withdrawn by the issuer. Kept as an audit trail, never deleted.
    Revoked = 1,
}

/// A verifiable claim attached to a Passport (e.g. `tax_reg`, `ubo_check`).
/// Only a hash of the underlying evidence is on-chain; the evidence stays off-chain.
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Credential {
    /// Short identifier of the claim type (a Soroban `Symbol`).
    pub kind: Symbol,
    /// The issuer that attested it.
    pub issuer: Address,
    /// Commitment (hash) to the off-chain evidence.
    pub data_hash: BytesN<32>,
    /// Ledger timestamp (unix seconds) when it was attested.
    pub issued_at: u64,
    pub status: CredentialStatus,
}

/// The on-chain Business Passport: only trust-bearing facts live here.
/// PII / KYB documents live off-chain and are committed to via `data_hash`.
/// Read accessors are public so any Stellar contract can consume this trust primitive.
///
/// The Passport is a **non-transferable credential**: `owner` is set once at
/// issuance and no function can change it.
#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Passport {
    /// Sequential, contract-unique identifier assigned at issuance.
    pub passport_id: u64,
    /// The business's Stellar account. Immutable.
    pub owner: Address,
    pub status: PassportStatus,
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
    /// Pointer to off-chain identity metadata (display name, theme). Deliberately
    /// **not** credit information: colours and styling are never stored here.
    pub metadata_uri: String,
}

/// Storage keys. Roles live in instance storage; each Passport is a persistent
/// entry keyed by the business address.
///
/// Two write roles are intentionally separated:
/// - `Issuer` issues Passports, sets KYB status, and manages status and
///   credentials (the Fondealo backend / admin key acting on an approved KYB).
/// - `RepManager` applies reputation updates — this is the `credit_score`
///   contract, which updates the Passport via a cross-contract call.
///
/// The owner (the business) controls only its own `metadata_uri`.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Issuer,
    RepManager,
    /// Next `passport_id` to hand out.
    NextId,
    Passport(Address),
    /// One credential, keyed by (business, kind).
    Credential(Address, Symbol),
    /// Ordered list of credential kinds attached to a business.
    CredentialKinds(Address),
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
    PassportFrozen = 8,
    PassportRevoked = 9,
    MetadataTooLong = 10,
    CredentialNotFound = 11,
    CredentialAlreadyExists = 12,
    TooManyCredentials = 13,
    InvalidStatusTransition = 14,
}
