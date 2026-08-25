#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env,
};

struct Fixture {
    env: Env,
    client: BusinessPassportContractClient<'static>,
    admin: Address,
    issuer: Address,
    rep_manager: Address,
}

fn setup() -> Fixture {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(BusinessPassportContract, ());
    let client = BusinessPassportContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let rep_manager = Address::generate(&env);
    client.init(&admin, &issuer, &rep_manager);
    Fixture {
        env,
        client,
        admin,
        issuer,
        rep_manager,
    }
}

fn hash(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[7u8; 32])
}

#[test]
fn init_sets_roles() {
    let f = setup();
    assert_eq!(f.client.admin(), f.admin);
    assert_eq!(f.client.issuer(), f.issuer);
    assert_eq!(f.client.reputation_manager(), f.rep_manager);
}

#[test]
fn double_init_fails() {
    let f = setup();
    let res = f.client.try_init(&f.admin, &f.issuer, &f.rep_manager);
    assert_eq!(res, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn issue_creates_passport_with_derived_band() {
    let f = setup();
    let business = Address::generate(&f.env);
    f.client
        .issue(&business, &KybStatus::Accepted, &720, &hash(&f.env));

    let p = f.client.get(&business).unwrap();
    assert_eq!(p.kyb_status, KybStatus::Accepted);
    assert_eq!(p.score, 720);
    assert_eq!(p.risk_band, RiskBand::B); // 650-799
    assert_eq!(p.loans_total, 0);
    assert_eq!(p.loans_repaid, 0);
    assert!(f.client.exists(&business));
}

#[test]
fn issue_requires_accepted_kyb() {
    let f = setup();
    let business = Address::generate(&f.env);
    let res = f
        .client
        .try_issue(&business, &KybStatus::Processing, &500, &hash(&f.env));
    assert_eq!(res, Err(Ok(Error::NotAccepted)));
    assert!(!f.client.exists(&business));
}

#[test]
fn issue_rejects_out_of_range_score() {
    let f = setup();
    let business = Address::generate(&f.env);
    let res = f
        .client
        .try_issue(&business, &KybStatus::Accepted, &1001, &hash(&f.env));
    assert_eq!(res, Err(Ok(Error::InvalidScore)));
}

#[test]
fn issue_twice_fails() {
    let f = setup();
    let business = Address::generate(&f.env);
    f.client
        .issue(&business, &KybStatus::Accepted, &500, &hash(&f.env));
    let res = f
        .client
        .try_issue(&business, &KybStatus::Accepted, &500, &hash(&f.env));
    assert_eq!(res, Err(Ok(Error::PassportAlreadyIssued)));
}

#[test]
fn apply_reputation_updates_score_and_band() {
    let f = setup();
    let business = Address::generate(&f.env);
    f.client
        .issue(&business, &KybStatus::Accepted, &500, &hash(&f.env));

    // Simulate a successful, on-time repayment pushing the score up.
    f.client.apply_reputation(&business, &810, &1, &1, &1);
    let p = f.client.get(&business).unwrap();
    assert_eq!(p.score, 810);
    assert_eq!(p.risk_band, RiskBand::A); // 800+
    assert_eq!(p.loans_total, 1);
    assert_eq!(p.loans_repaid, 1);
    assert_eq!(p.on_time_streak, 1);
}

#[test]
fn reputation_survives_between_loans() {
    let f = setup();
    let business = Address::generate(&f.env);
    f.client
        .issue(&business, &KybStatus::Accepted, &500, &hash(&f.env));

    // Loan #1 repaid -> score up.
    f.client.apply_reputation(&business, &560, &1, &1, &1);
    // Time passes; loan #2 repaid -> score keeps compounding from prior state.
    f.env
        .ledger()
        .set_timestamp(f.env.ledger().timestamp() + 60 * 60 * 24 * 30);
    f.client.apply_reputation(&business, &640, &2, &2, &2);

    let p = f.client.get(&business).unwrap();
    assert_eq!(p.score, 640);
    assert_eq!(p.loans_repaid, 2);
    assert_eq!(p.on_time_streak, 2);
}

#[test]
fn set_kyb_updates_status() {
    let f = setup();
    let business = Address::generate(&f.env);
    f.client
        .issue(&business, &KybStatus::Accepted, &500, &hash(&f.env));
    f.client.set_kyb(&business, &KybStatus::Rejected);
    assert_eq!(
        f.client.get(&business).unwrap().kyb_status,
        KybStatus::Rejected
    );
}

#[test]
fn mutations_on_missing_passport_fail() {
    let f = setup();
    let business = Address::generate(&f.env);
    let res = f.client.try_set_kyb(&business, &KybStatus::Accepted);
    assert_eq!(res, Err(Ok(Error::PassportNotFound)));
    let res2 = f.client.try_bump_ttl(&business);
    assert_eq!(res2, Err(Ok(Error::PassportNotFound)));
}

#[test]
fn roles_can_be_rotated_by_admin() {
    let f = setup();
    let new_issuer = Address::generate(&f.env);
    let new_manager = Address::generate(&f.env);
    f.client.set_issuer(&new_issuer);
    f.client.set_reputation_manager(&new_manager);
    assert_eq!(f.client.issuer(), new_issuer);
    assert_eq!(f.client.reputation_manager(), new_manager);
}
