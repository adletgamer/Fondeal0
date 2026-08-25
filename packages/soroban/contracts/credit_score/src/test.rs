#![cfg(test)]

use super::*;
use business_passport::{BusinessPassportContract, BusinessPassportContractClient, KybStatus};
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

struct Fixture {
    env: Env,
    passport: BusinessPassportContractClient<'static>,
    score: CreditScoreContractClient<'static>,
    business: Address,
}

/// Deploy + wire passport and score, and issue a Passport for one business at
/// `start_score`.
fn setup(start_score: u32) -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let passport_id = env.register(BusinessPassportContract, ());
    let passport = BusinessPassportContractClient::new(&env, &passport_id);
    let score_id = env.register(CreditScoreContract, ());
    let score = CreditScoreContractClient::new(&env, &score_id);

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let reporter = Address::generate(&env);

    // The score contract is the Passport's reputation manager.
    passport.init(&admin, &issuer, &score_id);
    score.init(&admin, &passport_id, &reporter);

    let business = Address::generate(&env);
    let data_hash = BytesN::from_array(&env, &[1u8; 32]);
    passport.issue(&business, &KybStatus::Accepted, &start_score, &data_hash);

    Fixture {
        env,
        passport,
        score,
        business,
    }
}

#[test]
fn external_on_time_repayment_raises_score() {
    let f = setup(500);
    let after = f.score.on_repayment(&f.business, &true, &true);
    // headroom 500, streak_bonus 0, gain = 40 * 500 / 1000 = 20 => 520
    assert_eq!(after, 520);

    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, 520);
    assert_eq!(p.on_time_streak, 1);
    assert_eq!(p.loans_total, 1);
    assert_eq!(p.loans_repaid, 1);
}

#[test]
fn self_funded_repayment_is_score_neutral() {
    // Anti-gaming (R-01): funding your own loan must not move the score.
    let f = setup(500);
    let after = f.score.on_repayment(&f.business, &true, &false);
    assert_eq!(after, 500);

    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, 500); // unchanged
    assert_eq!(p.on_time_streak, 0); // streak not credited
    assert_eq!(p.loans_total, 1);
    assert_eq!(p.loans_repaid, 1);
}

#[test]
fn late_repayment_penalized() {
    let f = setup(500);
    let after = f.score.on_repayment(&f.business, &false, &true);
    assert_eq!(after, 470); // 500 - 30
    assert_eq!(f.passport.get(&f.business).unwrap().on_time_streak, 0);
}

#[test]
fn default_applies_large_penalty_and_counts_loan() {
    let f = setup(500);
    let after = f.score.on_default(&f.business);
    assert_eq!(after, 350); // 500 - 150

    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, 350);
    assert_eq!(p.loans_total, 1);
    assert_eq!(p.loans_repaid, 0); // not repaid
    assert_eq!(p.on_time_streak, 0);
}

#[test]
fn diminishing_returns_near_cap() {
    let low = CreditScoreContract::preview(Env::default(), 100, true, true, 0);
    let high = CreditScoreContract::preview(Env::default(), 950, true, true, 0);
    // gain at 100: 40 * 900 / 1000 = 36 -> 136 ; at 950: 40 * 50 / 1000 = 2 -> 952
    assert_eq!(low, 136);
    assert_eq!(high, 952);
    assert!(low - 100 > high - 950);
}

#[test]
fn score_never_exceeds_max() {
    let f = setup(995);
    let after = f.score.on_repayment(&f.business, &true, &true);
    assert!(after <= SCORE_MAX);
}

#[test]
fn streak_compounds_across_repayments() {
    let f = setup(500);
    let s1 = f.score.on_repayment(&f.business, &true, &true); // 520, streak 1
    let s2 = f.score.on_repayment(&f.business, &true, &true); // streak bonus kicks in
    assert_eq!(s1, 520);
    // from 520: headroom 480, bonus min(1*5,50)=5, gain = 45 * 480 / 1000 = 21 => 541
    assert_eq!(s2, 541);
    assert_eq!(f.passport.get(&f.business).unwrap().on_time_streak, 2);
}

#[test]
fn preview_matches_applied_score() {
    let f = setup(640);
    let predicted = f.score.preview(&640, &true, &true, &0);
    let applied = f.score.on_repayment(&f.business, &true, &true);
    assert_eq!(predicted, applied);
}

#[test]
fn repayment_without_passport_fails() {
    let f = setup(500);
    let stranger = Address::generate(&f.env);
    let res = f.score.try_on_repayment(&stranger, &true, &true);
    assert_eq!(res, Err(Ok(Error::PassportNotFound)));
}
