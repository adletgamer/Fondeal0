#![no_std]

//! Shared wire types and client interfaces. This crate has no `#[contract]`
//! implementation, so depending on it cannot add another contract's Wasm exports.

mod types;

pub use types::{
    Credential, CredentialStatus, DataKey, Error, KybStatus, Passport, PassportStatus, RiskBand,
    MAX_CREDENTIALS, MAX_METADATA_URI_LEN, SCORE_MAX,
};

use soroban_sdk::{contractclient, Address, Env};

/// The Business Passport entrypoints called by the score and escrow contracts.
/// Keep these signatures in step with `business_passport`'s deployed ABI.
#[contractclient(name = "BusinessPassportClient")]
pub trait BusinessPassportInterface {
    fn get(env: Env, business: Address) -> Option<Passport>;

    fn apply_reputation(
        env: Env,
        business: Address,
        score: u32,
        loans_total: u32,
        loans_repaid: u32,
        on_time_streak: u32,
    );
}

/// The Credit Score entrypoints called by Loan Escrow. The client receives the
/// successful value; contract errors still abort the cross-contract call.
#[contractclient(name = "CreditScoreClient")]
pub trait CreditScoreInterface {
    fn on_repayment(env: Env, business: Address, on_time: bool, external: bool) -> u32;
    fn on_default(env: Env, business: Address) -> u32;
}
