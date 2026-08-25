#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env,
};

fn setup() -> (
    Env,
    BusinessPassportContractClient<'static>,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(BusinessPassportContract, ());
    let client = BusinessPassportContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let writer = Address::generate(&env);
    client.init(&admin, &writer);
    (env, client, admin, writer)
}

fn hash(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[7u8; 32])
}

#[test]
fn init_sets_admin_and_writer() {
    let (_env, client, admin, writer) = setup();
    assert_eq!(client.admin(), admin);
    assert_eq!(client.writer(), writer);
}

#[test]
fn double_init_fails() {
    let (_env, client, admin, writer) = setup();
    let res = client.try_init(&admin, &writer);
    assert_eq!(res, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn issue_creates_passport_with_derived_band() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    client.issue(&business, &KybStatus::Accepted, &720, &hash(&env));

    let p = client.get(&business).unwrap();
    assert_eq!(p.kyb_status, KybStatus::Accepted);
    assert_eq!(p.score, 720);
    assert_eq!(p.risk_band, RiskBand::B); // 650-799
    assert_eq!(p.loans_total, 0);
    assert_eq!(p.loans_repaid, 0);
    assert!(client.exists(&business));
}

#[test]
fn issue_requires_accepted_kyb() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    let res = client.try_issue(&business, &KybStatus::Processing, &500, &hash(&env));
    assert_eq!(res, Err(Ok(Error::NotAccepted)));
    assert!(!client.exists(&business));
}

#[test]
fn issue_rejects_out_of_range_score() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    let res = client.try_issue(&business, &KybStatus::Accepted, &1001, &hash(&env));
    assert_eq!(res, Err(Ok(Error::InvalidScore)));
}

#[test]
fn issue_twice_fails() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    client.issue(&business, &KybStatus::Accepted, &500, &hash(&env));
    let res = client.try_issue(&business, &KybStatus::Accepted, &500, &hash(&env));
    assert_eq!(res, Err(Ok(Error::PassportAlreadyIssued)));
}

#[test]
fn apply_reputation_updates_score_and_band() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    client.issue(&business, &KybStatus::Accepted, &500, &hash(&env));

    // Simulate a successful, on-time repayment pushing the score up.
    client.apply_reputation(&business, &810, &1, &1, &1);
    let p = client.get(&business).unwrap();
    assert_eq!(p.score, 810);
    assert_eq!(p.risk_band, RiskBand::A); // 800+
    assert_eq!(p.loans_total, 1);
    assert_eq!(p.loans_repaid, 1);
    assert_eq!(p.on_time_streak, 1);
}

#[test]
fn reputation_survives_between_loans() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    client.issue(&business, &KybStatus::Accepted, &500, &hash(&env));

    // Loan #1 repaid -> score up.
    client.apply_reputation(&business, &560, &1, &1, &1);
    // Time passes; loan #2 repaid -> score keeps compounding from prior state.
    env.ledger()
        .set_timestamp(env.ledger().timestamp() + 60 * 60 * 24 * 30);
    client.apply_reputation(&business, &640, &2, &2, &2);

    let p = client.get(&business).unwrap();
    assert_eq!(p.score, 640);
    assert_eq!(p.loans_repaid, 2);
    assert_eq!(p.on_time_streak, 2);
}

#[test]
fn set_kyb_updates_status() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    client.issue(&business, &KybStatus::Accepted, &500, &hash(&env));
    client.set_kyb(&business, &KybStatus::Rejected);
    assert_eq!(
        client.get(&business).unwrap().kyb_status,
        KybStatus::Rejected
    );
}

#[test]
fn mutations_on_missing_passport_fail() {
    let (env, client, _admin, _writer) = setup();
    let business = Address::generate(&env);
    let res = client.try_set_kyb(&business, &KybStatus::Accepted);
    assert_eq!(res, Err(Ok(Error::PassportNotFound)));
    let res2 = client.try_bump_ttl(&business);
    assert_eq!(res2, Err(Ok(Error::PassportNotFound)));
}

#[test]
fn writer_can_be_rotated_by_admin() {
    let (env, client, _admin, _writer) = setup();
    let new_writer = Address::generate(&env);
    client.set_writer(&new_writer);
    assert_eq!(client.writer(), new_writer);
}
