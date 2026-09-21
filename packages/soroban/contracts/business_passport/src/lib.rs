#![no_std]
//! # Fondealo — Business Passport
//!
//! A reusable, verifiable on-chain **business credit identity**, implemented as a
//! **non-transferable credential**. It stores only trust-bearing facts (KYB status,
//! score, risk band, repayment counters, a hash commitment to off-chain KYB data,
//! and attached credentials). PII never touches the chain.
//!
//! ## Non-transferable by construction
//!
//! There is no `transfer`, `approve` or `transfer_from` — that absence is the
//! whole mechanism. A Passport's `owner` is the business's Stellar account, set
//! once at issuance; no function can change it. The only way to "move" a Passport
//! is for the issuer to revoke it and issue a new one to another business. This is
//! deliberately *not* an ERC-721/SBT port: Soroban lets us write exactly the
//! contract logic a credential needs instead of inheriting token semantics.
//!
//! ## Roles and who authorises what
//!
//! Every mutating entrypoint calls `require_auth` on the address that is allowed
//! to perform it:
//!
//! | Entrypoint | Authorised by |
//! | --- | --- |
//! | `issue`, `set_kyb`, `freeze`, `unfreeze`, `revoke`, `add_credential`, `revoke_credential` | `issuer` (Fondealo backend acting on an approved KYB) |
//! | `apply_reputation` (the score update) | `reputation_manager` (the `credit_score` contract) |
//! | `update_metadata` | the Passport's **owner** (the business itself) |
//! | `set_issuer`, `set_reputation_manager` | `admin` |
//!
//! Conceptual names used in the product spec map to these entrypoints:
//! `issue_passport`→`issue`, `get_passport`→`get`, `update_score`→`apply_reputation`,
//! `freeze_passport`→`freeze`.
//!
//! ## Identity vs trust
//!
//! What a business *looks like* (colours, pattern, display name) is an off-chain
//! concern referenced by `metadata_uri`. Credit facts — score, risk band, KYB,
//! repayments — are on-chain and can only be changed by the roles above. A
//! business can restyle its Passport but can never change its credit semantics.
//!
//! The Passport is the composable trust primitive at the center of Fondealo:
//! any Stellar contract can read it via [`BusinessPassportContract::get`].
//!
//! Reputation must *survive between loans*, so persistent entries are actively
//! kept alive (every read/write bumps TTL, and [`BusinessPassportContract::bump_ttl`]
//! plus an off-chain job extend it before archival).

mod types;

#[cfg(test)]
mod test;

pub use types::{
    Credential, CredentialStatus, DataKey, Error, KybStatus, Passport, PassportStatus, RiskBand,
    MAX_CREDENTIALS, MAX_METADATA_URI_LEN, SCORE_MAX,
};

use soroban_sdk::{
    contract, contractevent, contractimpl, Address, BytesN, Env, String, Symbol, Vec,
};

/// Emitted when a Passport is first issued. Topic: `issued`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Issued {
    #[topic]
    pub business: Address,
    pub passport_id: u64,
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

/// Emitted when the owner changes the metadata pointer. Topic: `metadata_updated`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MetadataUpdated {
    #[topic]
    pub business: Address,
}

/// Emitted when a Passport is frozen, unfrozen or revoked. Topic: `status_changed`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StatusChanged {
    #[topic]
    pub business: Address,
    pub status: PassportStatus,
}

/// Emitted when a credential is attached. Topic: `credential_added`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CredentialAdded {
    #[topic]
    pub business: Address,
    pub kind: Symbol,
}

/// Emitted when a credential is revoked. Topic: `credential_revoked`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CredentialRevoked {
    #[topic]
    pub business: Address,
    pub kind: Symbol,
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
    /// The Passport starts `Active` with an empty `metadata_uri`.
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
        let passport_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(1u64);
        env.storage()
            .instance()
            .set(&DataKey::NextId, &(passport_id + 1));

        let now = env.ledger().timestamp();
        let passport = Passport {
            passport_id,
            owner: business.clone(),
            status: PassportStatus::Active,
            kyb_status,
            score: initial_score,
            risk_band: Self::band_for(initial_score),
            loans_total: 0,
            loans_repaid: 0,
            on_time_streak: 0,
            issued_at: now,
            updated_at: now,
            data_hash,
            metadata_uri: String::from_str(&env, ""),
        };
        env.storage().persistent().set(&key, &passport);
        Self::bump(&env, &key);
        Issued {
            business,
            passport_id,
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

    /// Whether `business` holds a Passport that is currently `Active`. Public —
    /// other contracts (e.g. an escrow) can gate on this instead of decoding the
    /// whole struct.
    pub fn is_active(env: Env, business: Address) -> bool {
        env.storage()
            .persistent()
            .get::<_, Passport>(&DataKey::Passport(business))
            .is_some_and(|p| p.status == PassportStatus::Active)
    }

    /// Update KYB status of an existing Passport. Issuer-gated. A revoked
    /// Passport cannot be changed.
    pub fn set_kyb(env: Env, business: Address, status: KybStatus) -> Result<(), Error> {
        Self::require_issuer(&env)?;
        let key = DataKey::Passport(business.clone());
        let mut p = Self::load(&env, &key)?;
        if p.status == PassportStatus::Revoked {
            return Err(Error::PassportRevoked);
        }
        p.kyb_status = status;
        p.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);
        Self::bump(&env, &key);
        KybUpdated { business, status }.publish(&env);
        Ok(())
    }

    /// Apply a reputation update from the Fondealo score engine (the product
    /// spec's `update_score`). Reputation-manager gated (the `credit_score`
    /// contract). The score contract computes the new values; the Passport is the
    /// store of record. `score` is bounded and the risk band is re-derived. Fails
    /// while the Passport is frozen or revoked.
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
        let mut p = Self::load_active(&env, &key)?;
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

    /// Point the Passport at off-chain identity metadata (display name, theme,
    /// pattern). **Owner-gated**: only the business itself can restyle its own
    /// Passport, and only while it is `Active`. This touches no credit field.
    pub fn update_metadata(env: Env, business: Address, metadata_uri: String) -> Result<(), Error> {
        business.require_auth();
        if metadata_uri.len() > MAX_METADATA_URI_LEN {
            return Err(Error::MetadataTooLong);
        }
        let key = DataKey::Passport(business.clone());
        let mut p = Self::load_active(&env, &key)?;
        p.metadata_uri = metadata_uri;
        p.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);
        Self::bump(&env, &key);
        MetadataUpdated { business }.publish(&env);
        Ok(())
    }

    /// Suspend a Passport (`Active` → `Frozen`). Issuer-gated, reversible.
    pub fn freeze(env: Env, business: Address) -> Result<(), Error> {
        Self::transition(
            &env,
            business,
            PassportStatus::Active,
            PassportStatus::Frozen,
        )
    }

    /// Lift a suspension (`Frozen` → `Active`). Issuer-gated.
    pub fn unfreeze(env: Env, business: Address) -> Result<(), Error> {
        Self::transition(
            &env,
            business,
            PassportStatus::Frozen,
            PassportStatus::Active,
        )
    }

    /// Permanently withdraw a Passport (`Active`/`Frozen` → `Revoked`).
    /// Issuer-gated, terminal.
    pub fn revoke(env: Env, business: Address) -> Result<(), Error> {
        Self::require_issuer(&env)?;
        let key = DataKey::Passport(business.clone());
        let mut p = Self::load(&env, &key)?;
        if p.status == PassportStatus::Revoked {
            return Err(Error::InvalidStatusTransition);
        }
        p.status = PassportStatus::Revoked;
        p.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);
        Self::bump(&env, &key);
        StatusChanged {
            business,
            status: PassportStatus::Revoked,
        }
        .publish(&env);
        Ok(())
    }

    /// Attach a verifiable credential (e.g. `tax_reg`, `ubo_check`) to an `Active`
    /// Passport. Issuer-gated. A `kind` can be attached once; revoking it keeps the
    /// record as an audit trail, so a replacement needs a new `kind`.
    pub fn add_credential(
        env: Env,
        business: Address,
        kind: Symbol,
        data_hash: BytesN<32>,
    ) -> Result<(), Error> {
        Self::require_issuer(&env)?;
        Self::load_active(&env, &DataKey::Passport(business.clone()))?;

        let ckey = DataKey::Credential(business.clone(), kind.clone());
        if env.storage().persistent().has(&ckey) {
            return Err(Error::CredentialAlreadyExists);
        }
        let kinds_key = DataKey::CredentialKinds(business.clone());
        let mut kinds: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&kinds_key)
            .unwrap_or_else(|| Vec::new(&env));
        if kinds.len() >= MAX_CREDENTIALS {
            return Err(Error::TooManyCredentials);
        }
        kinds.push_back(kind.clone());

        let issuer: Address = env
            .storage()
            .instance()
            .get(&DataKey::Issuer)
            .ok_or(Error::NotInitialized)?;
        let credential = Credential {
            kind: kind.clone(),
            issuer,
            data_hash,
            issued_at: env.ledger().timestamp(),
            status: CredentialStatus::Active,
        };
        env.storage().persistent().set(&ckey, &credential);
        env.storage().persistent().set(&kinds_key, &kinds);
        Self::bump(&env, &ckey);
        Self::bump(&env, &kinds_key);
        CredentialAdded { business, kind }.publish(&env);
        Ok(())
    }

    /// Withdraw a credential. Issuer-gated. Allowed even while the Passport is
    /// frozen, so a compromised claim can always be pulled.
    pub fn revoke_credential(env: Env, business: Address, kind: Symbol) -> Result<(), Error> {
        Self::require_issuer(&env)?;
        let ckey = DataKey::Credential(business.clone(), kind.clone());
        let mut credential: Credential = env
            .storage()
            .persistent()
            .get(&ckey)
            .ok_or(Error::CredentialNotFound)?;
        if credential.status == CredentialStatus::Revoked {
            return Err(Error::InvalidStatusTransition);
        }
        credential.status = CredentialStatus::Revoked;
        env.storage().persistent().set(&ckey, &credential);
        Self::bump(&env, &ckey);
        CredentialRevoked { business, kind }.publish(&env);
        Ok(())
    }

    /// Read one credential. Public.
    pub fn get_credential(env: Env, business: Address, kind: Symbol) -> Option<Credential> {
        env.storage()
            .persistent()
            .get(&DataKey::Credential(business, kind))
    }

    /// Every credential attached to `business`, in attachment order. Public.
    pub fn credentials(env: Env, business: Address) -> Vec<Credential> {
        let kinds: Vec<Symbol> = env
            .storage()
            .persistent()
            .get(&DataKey::CredentialKinds(business.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        let mut out = Vec::new(&env);
        for kind in kinds.iter() {
            if let Some(c) = env
                .storage()
                .persistent()
                .get::<_, Credential>(&DataKey::Credential(business.clone(), kind))
            {
                out.push_back(c);
            }
        }
        out
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

    /// Like `load`, but rejects frozen or revoked Passports.
    fn load_active(env: &Env, key: &DataKey) -> Result<Passport, Error> {
        let p = Self::load(env, key)?;
        match p.status {
            PassportStatus::Active => Ok(p),
            PassportStatus::Frozen => Err(Error::PassportFrozen),
            PassportStatus::Revoked => Err(Error::PassportRevoked),
        }
    }

    /// Issuer-gated status change that must start from `from`.
    fn transition(
        env: &Env,
        business: Address,
        from: PassportStatus,
        to: PassportStatus,
    ) -> Result<(), Error> {
        Self::require_issuer(env)?;
        let key = DataKey::Passport(business.clone());
        let mut p = Self::load(env, &key)?;
        if p.status == PassportStatus::Revoked {
            return Err(Error::PassportRevoked);
        }
        if p.status != from {
            return Err(Error::InvalidStatusTransition);
        }
        p.status = to;
        p.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &p);
        Self::bump(env, &key);
        StatusChanged {
            business,
            status: to,
        }
        .publish(env);
        Ok(())
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
