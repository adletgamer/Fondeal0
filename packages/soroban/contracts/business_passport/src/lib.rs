#![no_std]
//! # Fondealo — Business Passport
//!
//! A reusable, verifiable on-chain **business credit identity**. It stores only
//! trust-bearing facts (KYB status, score, risk band, repayment counters, a hash
//! commitment to off-chain KYB data). PII never touches the chain.
//!
//! The Passport is the composable trust primitive at the center of Fondealo:
//! any Stellar contract can read it via [`BusinessPassportContract::get`].
//!
//! Two write roles are separated so the reputation engine can update the Passport
//! without also being able to issue identities:
//! - **`issuer`** — issues Passports and sets KYB status (the Fondealo backend key
//!   acting on an approved KYB).
//! - **`reputation_manager`** — applies reputation updates; this is the
//!   `credit_score` contract, which calls [`BusinessPassportContract::apply_reputation`]
//!   via a cross-contract call. `require_auth` on that contract's own address is
//!   satisfied automatically because it is the caller.
//!
//! Both roles are rotatable by the `admin`. Reputation must *survive between
//! loans*, so persistent entries are actively kept alive (every read/write bumps
//! TTL, and [`BusinessPassportContract::bump_ttl`] plus an off-chain job extend it
//! before archival).

mod types;

#[cfg(test)]
mod test;

pub use types::{DataKey, Error, KybStatus, Passport, RiskBand, SCORE_MAX};

use soroban_sdk::{contract, contractevent, contractimpl, Address, BytesN, Env};

/// Emitted when a Passport is first issued. Topic: `issued`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Issued {
    #[topic]
    pub business: Address,
    pub score: u32,
}

/// Emitted when a Passport's KYB status changes. Topic: `kyb_updated`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct KybUpdated {
    #[topic]
    pub business: Address,
    pub status: KybStatus,
}

/// Emitted when a reputation update is applied. Topic: `reputation_updated`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ReputationUpdated {
    #[topic]
    pub business: Address,
    pub score: u32,
}

// --- TTL policy (ledgers). Testnet ~5s/ledger => ~17,280 ledgers/day. ---
/// Bump when remaining TTL drops below ~30 days.
const TTL_BUMP_THRESHOLD: u32 = 30 * 17_280;
/// Extend persistent/instance entries to ~90 days on each touch.
const TTL_EXTEND_TO: u32 = 90 * 17_280;

#[contract]
pub struct BusinessPassportContract;

#[contractimpl]
impl BusinessPassportContract {
    /// Initialize once with the three roles. `admin` can rotate `issuer` and
    /// `reputation_manager`.
    pub fn init(
        env: Env,
        admin: Address,
        issuer: Address,
        reputation_manager: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Issuer, &issuer);
        env.storage()
            .instance()
            .set(&DataKey::RepManager, &reputation_manager);
        env.storage()
            .instance()
            .extend_ttl(TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }

    /// Rotate the issuer. Admin-gated.
    pub fn set_issuer(env: Env, new_issuer: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::Issuer, &new_issuer);
        Ok(())
    }

    /// Rotate the reputation manager (the `credit_score` contract). Admin-gated.
    pub fn set_reputation_manager(env: Env, new_manager: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage()
            .instance()
            .set(&DataKey::RepManager, &new_manager);
        Ok(())
    }

    /// Issue a Passport for `business`. Issuer-gated. Fails if one already exists.
    /// `initial_score` is bounded to `0..=SCORE_MAX`; the initial risk band is
    /// derived from it. Only businesses with `KybStatus::Accepted` may be issued.
    pub fn issue(
        env: Env,
        business: Address,
        kyb_status: KybStatus,
        initial_score: u32,
        data_hash: BytesN<32>,
    ) -> Result<(), Error> {
        Self::require_issuer(&env)?;
        if kyb_status != KybStatus::Accepted {
            return Err(Error::NotAccepted);
        }
        if initial_score > SCORE_MAX {
            return Err(Error::InvalidScore);
        }
        let key = DataKey::Passport(business.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::PassportAlreadyIssued);
        }
        let now = env.ledger().timestamp();
        let passport = Passport {
            kyb_status,
            score: initial_score,
            risk_band: Self::band_for(initial_score),
            loans_total: 0,
            loans_repaid: 0,
            on_time_streak: 0,
            issued_at: now,
            updated_at: now,
            data_hash,
        };
        env.storage().persistent().set(&key, &passport);
        Self::bump(&env, &key);
        Issued {
            business,
            score: initial_score,
        }
        .publish(&env);
        Ok(())
    }

    /// Read a Passport. Public — this is the composable trust primitive.
    pub fn get(env: Env, business: Address) -> Option<Passport> {
        let key = DataKey::Passport(business);
        let passport: Option<Passport> = env.storage().persistent().get(&key);
        if passport.is_some() {
            Self::bump(&env, &key);
        }
        passport
    }

    /// Whether a Passport exists for `business`. Public.
    pub fn exists(env: Env, business: Address) -> bool {
        env.storage().persistent().has(&DataKey::Passport(business))
    }

    /// Update KYB status of an existing Passport. Issuer-gated.
    pub fn set_kyb(env: Env, business: Address, status: KybStatus) -> Result<(), Error> {
        Self::require_issuer(&env)?;
        let key = DataKey::Passport(business.clone());
        let mut p = Self::load(&env, &key)?;
        p.kyb_status = status;
        p.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);
        Self::bump(&env, &key);
        KybUpdated { business, status }.publish(&env);
        Ok(())
    }

    /// Apply a reputation update from the Fondealo score engine. Reputation-manager
    /// gated (the `credit_score` contract). The score contract computes the new
    /// values; the Passport is the store of record. `score` is bounded and the risk
    /// band is re-derived.
    pub fn apply_reputation(
        env: Env,
        business: Address,
        score: u32,
        loans_total: u32,
        loans_repaid: u32,
        on_time_streak: u32,
    ) -> Result<(), Error> {
        Self::require_reputation_manager(&env)?;
        if score > SCORE_MAX {
            return Err(Error::InvalidScore);
        }
        let key = DataKey::Passport(business.clone());
        let mut p = Self::load(&env, &key)?;
        p.score = score;
        p.risk_band = Self::band_for(score);
        p.loans_total = loans_total;
        p.loans_repaid = loans_repaid;
        p.on_time_streak = on_time_streak;
        p.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);
        Self::bump(&env, &key);
        ReputationUpdated { business, score }.publish(&env);
        Ok(())
    }

    /// Extend the TTL of a Passport (and the contract instance) to keep reputation
    /// alive across long inactivity. Public — anyone may pay to keep a record warm.
    pub fn bump_ttl(env: Env, business: Address) -> Result<(), Error> {
        let key = DataKey::Passport(business);
        if !env.storage().persistent().has(&key) {
            return Err(Error::PassportNotFound);
        }
        Self::bump(&env, &key);
        Ok(())
    }

    /// Current admin. Public.
    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    /// Current issuer. Public.
    pub fn issuer(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Issuer)
            .ok_or(Error::NotInitialized)
    }

    /// Current reputation manager (the `credit_score` contract). Public.
    pub fn reputation_manager(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::RepManager)
            .ok_or(Error::NotInitialized)
    }

    // ---------------- internal helpers ----------------

    fn require_admin(env: &Env) -> Result<(), Error> {
        Self::require_role(env, &DataKey::Admin)
    }

    fn require_issuer(env: &Env) -> Result<(), Error> {
        Self::require_role(env, &DataKey::Issuer)
    }

    fn require_reputation_manager(env: &Env) -> Result<(), Error> {
        Self::require_role(env, &DataKey::RepManager)
    }

    fn require_role(env: &Env, key: &DataKey) -> Result<(), Error> {
        let addr: Address = env
            .storage()
            .instance()
            .get(key)
            .ok_or(Error::NotInitialized)?;
        addr.require_auth();
        Ok(())
    }

    fn load(env: &Env, key: &DataKey) -> Result<Passport, Error> {
        env.storage()
            .persistent()
            .get(key)
            .ok_or(Error::PassportNotFound)
    }

    fn bump(env: &Env, key: &DataKey) {
        env.storage()
            .persistent()
            .extend_ttl(key, TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .instance()
            .extend_ttl(TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
    }

    /// Deterministic, transparent mapping of score -> risk band.
    /// A: 800-1000, B: 650-799, C: 500-649, D: 350-499, E: 0-349.
    fn band_for(score: u32) -> RiskBand {
        match score {
            800..=1000 => RiskBand::A,
            650..=799 => RiskBand::B,
            500..=649 => RiskBand::C,
            350..=499 => RiskBand::D,
            _ => RiskBand::E,
        }
    }
}
