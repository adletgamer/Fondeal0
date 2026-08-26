#![no_std]
//! # Fondealo — Loan Escrow
//!
//! Collateral + tranche logic for the funding flow (docs/product-v2.md §5).
//! A business locks a fraction of its working capital as first-loss
//! collateral (size set by its Passport's risk band); investors fund the
//! rest in USDC (a Stellar Asset Contract). On full repayment, investors are
//! paid principal + interest pro-rata, collateral returns to the business,
//! and the business's Passport score improves via `credit_score`. On
//! default, collateral (plus any partial repayment already collected) is
//! seized pro-rata to investors and the score is penalized.
//!
//! `external` — whether a loan was funded by someone other than the
//! business itself — is derived here from the actual funder addresses that
//! called `fund`, not asserted by a caller. That closes the anti-gaming gap
//! left open in Phase 5 (see docs/score-spec.md's anti-gaming checklist).

mod types;

#[cfg(test)]
mod test;

pub use types::{collateral_ratio_bps, DataKey, Error, Opportunity, OpportunityStatus};

use business_passport::{BusinessPassportContractClient, RiskBand};
use credit_score::CreditScoreContractClient;
use soroban_sdk::{contract, contractevent, contractimpl, token, Address, Env, Map};

// --- Grace + TTL policy (ledgers/seconds). Testnet ~5s/ledger => ~17,280 ledgers/day. ---
/// Seconds past `due_at` before `default` becomes callable.
const GRACE_PERIOD_SECONDS: u64 = 7 * 86_400;
const SECONDS_PER_DAY: u64 = 86_400;
const TTL_BUMP_THRESHOLD: u32 = 30 * 17_280;
const TTL_EXTEND_TO: u32 = 90 * 17_280;

/// Emitted when a business opens a funding opportunity. Topic: `created`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Created {
    #[topic]
    pub opportunity_id: u64,
    pub business: Address,
    pub principal: i128,
    pub collateral_amount: i128,
}

/// Emitted on each investor contribution. Topic: `funded`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Funded {
    #[topic]
    pub opportunity_id: u64,
    pub investor: Address,
    pub amount: i128,
}

/// Emitted when principal is released to the business. Topic: `released`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Released {
    #[topic]
    pub opportunity_id: u64,
    pub business: Address,
    pub principal: i128,
}

/// Emitted on each repayment. `final_payment` is true iff this call brought
/// the loan to `Repaid`. Topic: `repaid`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Repaid {
    #[topic]
    pub opportunity_id: u64,
    pub amount: i128,
    pub final_payment: bool,
}

/// Emitted when an opportunity defaults. Topic: `defaulted`.
#[contractevent]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Defaulted {
    #[topic]
    pub opportunity_id: u64,
    pub business: Address,
    pub recovered: i128,
}

#[contract]
pub struct LoanEscrowContract;

#[contractimpl]
impl LoanEscrowContract {
    /// Initialize once. `passport`/`score` are the deployed Fondealo
    /// contracts; `token` is the USDC Stellar Asset Contract; `keeper` is the
    /// address allowed to call `default` once a loan is past due + grace.
    pub fn init(
        env: Env,
        admin: Address,
        passport: Address,
        score: Address,
        token: Address,
        keeper: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Passport, &passport);
        env.storage().instance().set(&DataKey::Score, &score);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Keeper, &keeper);
        env.storage()
            .instance()
            .extend_ttl(TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }

    /// Business-gated: open a funding opportunity and lock `collateral_amount`
    /// of the business's own USDC as first-loss collateral. The collateral
    /// must equal `principal * collateralRatio(band)` for the business's
    /// *current* Passport risk band — read here, not trusted from the caller.
    pub fn create(
        env: Env,
        opportunity_id: u64,
        business: Address,
        principal: i128,
        term_days: u32,
        collateral_amount: i128,
        apr_bps: u32,
    ) -> Result<(), Error> {
        business.require_auth();
        if principal <= 0 || term_days == 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Opportunity(opportunity_id);
        if env.storage().persistent().has(&key) {
            return Err(Error::OpportunityAlreadyExists);
        }

        let passport = Self::passport_client(&env);
        let p = passport.get(&business).ok_or(Error::PassportNotFound)?;
        let required = Self::required_collateral(principal, p.risk_band);
        if collateral_amount != required {
            return Err(Error::CollateralMismatch);
        }

        Self::token_client(&env).transfer(
            &business,
            env.current_contract_address(),
            &collateral_amount,
        );

        let opportunity = Opportunity {
            business: business.clone(),
            principal,
            collateral_amount,
            apr_bps,
            term_days,
            funded: 0,
            repaid: 0,
            status: OpportunityStatus::Open,
            due_at: 0,
        };
        env.storage().persistent().set(&key, &opportunity);
        env.storage().persistent().set(
            &DataKey::Shares(opportunity_id),
            &Map::<Address, i128>::new(&env),
        );
        Self::bump(&env, opportunity_id);

        Created {
            opportunity_id,
            business,
            principal,
            collateral_amount,
        }
        .publish(&env);
        Ok(())
    }

    /// Investor-gated (self-authorizing, no allowlist): pull `amount` USDC
    /// from `investor` into escrow. Rejects funding past `principal`. Once
    /// `funded == principal`, the opportunity closes to further funding.
    pub fn fund(
        env: Env,
        opportunity_id: u64,
        investor: Address,
        amount: i128,
    ) -> Result<(), Error> {
        investor.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Opportunity(opportunity_id);
        let mut opportunity = Self::load(&env, &key)?;
        if opportunity.status != OpportunityStatus::Open {
            return Err(Error::InvalidStatus);
        }
        let new_funded = opportunity.funded + amount;
        if new_funded > opportunity.principal {
            return Err(Error::OverFunding);
        }

        Self::token_client(&env).transfer(&investor, env.current_contract_address(), &amount);

        let shares_key = DataKey::Shares(opportunity_id);
        let mut shares: Map<Address, i128> = env.storage().persistent().get(&shares_key).unwrap();
        let prior = shares.get(investor.clone()).unwrap_or(0);
        shares.set(investor.clone(), prior + amount);
        env.storage().persistent().set(&shares_key, &shares);

        opportunity.funded = new_funded;
        if new_funded == opportunity.principal {
            opportunity.status = OpportunityStatus::Funded;
        }
        env.storage().persistent().set(&key, &opportunity);
        Self::bump(&env, opportunity_id);

        Funded {
            opportunity_id,
            investor,
            amount,
        }
        .publish(&env);
        Ok(())
    }

    /// Business-gated: once fully funded, transfer `principal` to the
    /// business. Collateral stays locked in escrow. Starts the repayment
    /// clock (`due_at`).
    pub fn release(env: Env, opportunity_id: u64) -> Result<(), Error> {
        let key = DataKey::Opportunity(opportunity_id);
        let mut opportunity = Self::load(&env, &key)?;
        opportunity.business.require_auth();
        if opportunity.status != OpportunityStatus::Funded {
            return Err(Error::InvalidStatus);
        }

        Self::token_client(&env).transfer(
            &env.current_contract_address(),
            &opportunity.business,
            &opportunity.principal,
        );

        opportunity.status = OpportunityStatus::Active;
        opportunity.due_at =
            env.ledger().timestamp() + (opportunity.term_days as u64) * SECONDS_PER_DAY;
        env.storage().persistent().set(&key, &opportunity);
        Self::bump(&env, opportunity_id);

        Released {
            opportunity_id,
            business: opportunity.business,
            principal: opportunity.principal,
        }
        .publish(&env);
        Ok(())
    }

    /// Business-gated: repay `amount` USDC. May be called multiple times.
    /// The call that brings cumulative `repaid` to the full amount due
    /// distributes principal + interest to investors pro-rata, returns
    /// collateral to the business, and reports the repayment to
    /// `credit_score` with `external` derived from the actual funder set
    /// (not asserted).
    pub fn repay(env: Env, opportunity_id: u64, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let key = DataKey::Opportunity(opportunity_id);
        let mut opportunity = Self::load(&env, &key)?;
        opportunity.business.require_auth();
        if opportunity.status != OpportunityStatus::Active {
            return Err(Error::InvalidStatus);
        }

        let total_due = Self::total_due(
            opportunity.principal,
            opportunity.apr_bps,
            opportunity.term_days,
        );
        let new_repaid = opportunity.repaid + amount;
        if new_repaid > total_due {
            return Err(Error::RepaymentExceedsDue);
        }

        let token = Self::token_client(&env);
        token.transfer(
            &opportunity.business,
            env.current_contract_address(),
            &amount,
        );
        opportunity.repaid = new_repaid;

        let final_payment = new_repaid == total_due;
        if final_payment {
            let shares: Map<Address, i128> = env
                .storage()
                .persistent()
                .get(&DataKey::Shares(opportunity_id))
                .unwrap();

            Self::distribute_pro_rata(&env, &token, &shares, opportunity.principal, total_due);
            token.transfer(
                &env.current_contract_address(),
                &opportunity.business,
                &opportunity.collateral_amount,
            );

            let on_time = env.ledger().timestamp() <= opportunity.due_at;
            let external = Self::has_external_funder(&shares, &opportunity.business);
            Self::score_client(&env).on_repayment(&opportunity.business, &on_time, &external);

            opportunity.status = OpportunityStatus::Repaid;
        }

        env.storage().persistent().set(&key, &opportunity);
        Self::bump(&env, opportunity_id);

        Repaid {
            opportunity_id,
            amount,
            final_payment,
        }
        .publish(&env);
        Ok(())
    }

    /// Keeper-gated: after `due_at` + the grace period, seize collateral
    /// (plus any partial repayment already collected) pro-rata to investors
    /// and report the default to `credit_score`.
    pub fn default(env: Env, opportunity_id: u64) -> Result<(), Error> {
        Self::require_keeper(&env)?;
        let key = DataKey::Opportunity(opportunity_id);
        let mut opportunity = Self::load(&env, &key)?;
        if opportunity.status != OpportunityStatus::Active {
            return Err(Error::InvalidStatus);
        }
        if env.ledger().timestamp() < opportunity.due_at + GRACE_PERIOD_SECONDS {
            return Err(Error::NotYetDue);
        }

        let token = Self::token_client(&env);
        let shares: Map<Address, i128> = env
            .storage()
            .persistent()
            .get(&DataKey::Shares(opportunity_id))
            .unwrap();
        let recovered = opportunity.collateral_amount + opportunity.repaid;
        Self::distribute_pro_rata(&env, &token, &shares, opportunity.principal, recovered);

        Self::score_client(&env).on_default(&opportunity.business);

        opportunity.status = OpportunityStatus::Defaulted;
        env.storage().persistent().set(&key, &opportunity);
        Self::bump(&env, opportunity_id);

        Defaulted {
            opportunity_id,
            business: opportunity.business,
            recovered,
        }
        .publish(&env);
        Ok(())
    }

    /// Read one opportunity. Public.
    pub fn get_opportunity(env: Env, opportunity_id: u64) -> Option<Opportunity> {
        env.storage()
            .persistent()
            .get(&DataKey::Opportunity(opportunity_id))
    }

    /// Read one investor's contribution to an opportunity (0 if none). Public.
    pub fn get_position(env: Env, opportunity_id: u64, investor: Address) -> i128 {
        let shares: Option<Map<Address, i128>> = env
            .storage()
            .persistent()
            .get(&DataKey::Shares(opportunity_id));
        shares.and_then(|m| m.get(investor)).unwrap_or(0)
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn keeper(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Keeper)
            .ok_or(Error::NotInitialized)
    }

    /// Rotate the keeper. Admin-gated.
    pub fn set_keeper(env: Env, new_keeper: Address) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::Keeper, &new_keeper);
        Ok(())
    }

    // ---------------- internal ----------------

    fn required_collateral(principal: i128, band: RiskBand) -> i128 {
        (principal * collateral_ratio_bps(band)) / 10_000
    }

    /// Simple interest over the full term: `principal * aprBps/10000 * termDays/365`.
    /// MUST match `buildRepaymentSchedule`'s total in packages/types/src/collateral.ts.
    fn total_due(principal: i128, apr_bps: u32, term_days: u32) -> i128 {
        let interest = principal * (apr_bps as i128) * (term_days as i128) / (10_000i128 * 365i128);
        principal + interest
    }

    /// Split `total` across `shares` in proportion to each investor's
    /// contribution relative to `principal`. The last entry (by iteration
    /// order) absorbs the rounding remainder so the sum distributed is
    /// always exactly `total` — never a stroop left stranded in the contract.
    fn distribute_pro_rata(
        env: &Env,
        token: &token::Client,
        shares: &Map<Address, i128>,
        principal: i128,
        total: i128,
    ) {
        let len = shares.len();
        let mut distributed: i128 = 0;
        for (i, (investor, contribution)) in shares.iter().enumerate() {
            let is_last = (i as u32) + 1 == len;
            let payout = if is_last {
                total - distributed
            } else {
                (total * contribution) / principal
            };
            distributed += payout;
            if payout > 0 {
                token.transfer(&env.current_contract_address(), &investor, &payout);
            }
        }
    }

    /// Whether at least one funder is not the business itself — derived from
    /// actual on-chain contributions, never a caller-supplied flag.
    fn has_external_funder(shares: &Map<Address, i128>, business: &Address) -> bool {
        shares
            .iter()
            .any(|(investor, _amount)| &investor != business)
    }

    fn load(env: &Env, key: &DataKey) -> Result<Opportunity, Error> {
        env.storage()
            .persistent()
            .get(key)
            .ok_or(Error::OpportunityNotFound)
    }

    fn token_client(env: &Env) -> token::Client<'_> {
        let addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("not initialized");
        token::Client::new(env, &addr)
    }

    fn passport_client(env: &Env) -> BusinessPassportContractClient<'_> {
        let addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Passport)
            .expect("not initialized");
        BusinessPassportContractClient::new(env, &addr)
    }

    fn score_client(env: &Env) -> CreditScoreContractClient<'_> {
        let addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Score)
            .expect("not initialized");
        CreditScoreContractClient::new(env, &addr)
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

    fn require_keeper(env: &Env) -> Result<(), Error> {
        let keeper: Address = env
            .storage()
            .instance()
            .get(&DataKey::Keeper)
            .ok_or(Error::NotInitialized)?;
        keeper.require_auth();
        Ok(())
    }

    fn bump(env: &Env, opportunity_id: u64) {
        env.storage().persistent().extend_ttl(
            &DataKey::Opportunity(opportunity_id),
            TTL_BUMP_THRESHOLD,
            TTL_EXTEND_TO,
        );
        env.storage().persistent().extend_ttl(
            &DataKey::Shares(opportunity_id),
            TTL_BUMP_THRESHOLD,
            TTL_EXTEND_TO,
        );
        env.storage()
            .instance()
            .extend_ttl(TTL_BUMP_THRESHOLD, TTL_EXTEND_TO);
    }
}
