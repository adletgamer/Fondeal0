#![no_std]
//! # Fondealo — Credit Reputation engine
//!
//! Deterministic, transparent, open-source scoring. This contract does not store
//! the score; the **Business Passport is the store of record**. On each loan
//! lifecycle event the engine reads the current Passport, computes the next score
//! by a fixed formula, and writes it back via a cross-contract call to the
//! Passport's `apply_reputation` (this contract is the Passport's
//! `reputation_manager`, so its own-address auth is satisfied automatically).
//!
//! ## Score model (v1) — see `docs/score-spec.md`
//! - Score domain: `0..=1000`. Risk bands are derived by the Passport.
//! - **Only externally-funded, on-time repayments raise the score.** A round-trip
//!   where the business funds its own loan (`external == false`) is **score-neutral**
//!   — this is the core anti-gaming rule (risk R-01: Sybil / wash-repayment).
//! - Gains have **diminishing returns**: `gain = (base + streak_bonus) * headroom / MAX`,
//!   so the closer to the cap, the smaller the gain.
//! - Late repayment applies a fixed penalty; default applies a larger one and
//!   resets the on-time streak.

#[cfg(test)]
mod test;

use business_passport::BusinessPassportContractClient;
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env,
};

/// Maximum score. Mirrors the Passport's `SCORE_MAX`.
pub const SCORE_MAX: u32 = 1000;

// --- Score parameters (v1). Transparent and fixed; changes ship as a new version. ---
const BASE_GAIN: u32 = 40;
const STREAK_BONUS_PER: u32 = 5;
const STREAK_BONUS_MAX: u32 = 50;
const LATE_PENALTY: u32 = 30;
const DEFAULT_PENALTY: u32 = 150;

const TTL_BUMP_THRESHOLD: u32 = 30 * 17_280;
const TTL_EXTEND_TO: u32 = 90 * 17_280;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// Address of the deployed `business_passport` contract.
    Passport,
    /// Address allowed to report loan outcomes (the escrow contract / backend).
    Reporter,
}

#[contracterror]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    PassportNotFound = 3,
}

/// Emitted on every scored event. Topic: `scored`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Scored {
    #[topic]
    pub business: Address,
    pub score_before: u32,
    pub score_after: u32,
}

#[contract]
pub struct CreditScoreContract;

#[contractimpl]
impl CreditScoreContract {
    /// Initialize once. `passport` is the Business Passport contract address (this
    /// contract must be set as that Passport's `reputation_manager`). `reporter`
    /// is the escrow/backend allowed to report loan outcomes.
    pub fn init(
        env: Env,
        admin: Address,
        passport: Address,
        reporter: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Passport, &passport);
        env.storage().instance().set(&DataKey::Reporter, &reporter);
        env.storage()
            .instance()
            .extend_ttl(TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }

    /// Report a repayment and update the business's score. Reporter-gated.
    /// `on_time`: was the installment/loan repaid on time? `external`: was the
    /// loan funded by third-party investors (not the business itself)?
    /// Returns the new score.
    pub fn on_repayment(
        env: Env,
        business: Address,
        on_time: bool,
        external: bool,
    ) -> Result<u32, Error> {
        Self::require_reporter(&env)?;
        let passport = Self::passport_client(&env);
        let current = passport.get(&business).ok_or(Error::PassportNotFound)?;

        let before = current.score;
        let after = Self::next_score(before, on_time, external, current.on_time_streak);
        let streak = if on_time && external {
            current.on_time_streak + 1
        } else {
            0
        };
        let loans_total = current.loans_total + 1;
        let loans_repaid = current.loans_repaid + 1;

        passport.apply_reputation(&business, &after, &loans_total, &loans_repaid, &streak);
        Self::bump(&env);
        Scored {
            business,
            score_before: before,
            score_after: after,
        }
        .publish(&env);
        Ok(after)
    }

    /// Report a default. Reporter-gated. Applies a penalty and resets the streak.
    /// Counts the loan as taken but not repaid. Returns the new score.
    pub fn on_default(env: Env, business: Address) -> Result<u32, Error> {
        Self::require_reporter(&env)?;
        let passport = Self::passport_client(&env);
        let current = passport.get(&business).ok_or(Error::PassportNotFound)?;

        let before = current.score;
        let after = before.saturating_sub(DEFAULT_PENALTY);
        let loans_total = current.loans_total + 1;

        passport.apply_reputation(&business, &after, &loans_total, &current.loans_repaid, &0);
        Self::bump(&env);
        Scored {
            business,
            score_before: before,
            score_after: after,
        }
        .publish(&env);
        Ok(after)
    }

    /// Pure preview of the next score. Public view — lets the UI show the effect of
    /// a repayment without a state change. Deterministic and identical to the logic
    /// applied on-chain.
    pub fn preview(
        _env: Env,
        current_score: u32,
        on_time: bool,
        external: bool,
        streak: u32,
    ) -> u32 {
        Self::next_score(current_score, on_time, external, streak)
    }

    /// Rotate the reporter. Admin-gated.
    pub fn set_reporter(env: Env, new_reporter: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage()
            .instance()
            .set(&DataKey::Reporter, &new_reporter);
        Ok(())
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn reporter(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Reporter)
            .ok_or(Error::NotInitialized)
    }

    pub fn passport(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Passport)
            .ok_or(Error::NotInitialized)
    }

    // ---------------- internal ----------------

    /// The v1 scoring function. Deterministic; the single source of truth for both
    /// `on_repayment` and `preview`.
    fn next_score(current: u32, on_time: bool, external: bool, streak: u32) -> u32 {
        // Anti-gaming (R-01): self-funded round trips never move the score.
        if !external {
            return current;
        }
        if on_time {
            let headroom = SCORE_MAX.saturating_sub(current);
            let streak_bonus = (streak * STREAK_BONUS_PER).min(STREAK_BONUS_MAX);
            // Diminishing returns: full gain at low scores, ~0 near the cap.
            let gain = (BASE_GAIN + streak_bonus).saturating_mul(headroom) / SCORE_MAX;
            (current + gain).min(SCORE_MAX)
        } else {
            current.saturating_sub(LATE_PENALTY)
        }
    }

    fn passport_client(env: &Env) -> BusinessPassportContractClient<'_> {
        let addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Passport)
            .expect("not initialized");
        BusinessPassportContractClient::new(env, &addr)
    }

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }

    fn require_reporter(env: &Env) -> Result<(), Error> {
        let reporter: Address = env
            .storage()
            .instance()
            .get(&DataKey::Reporter)
            .ok_or(Error::NotInitialized)?;
        reporter.require_auth();
        Ok(())
    }

    fn bump(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
    }
}
