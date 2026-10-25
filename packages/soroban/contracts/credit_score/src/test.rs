use super::*;
use business_passport::{BusinessPassportContract, BusinessPassportContractClient, KybStatus};
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    Address, BytesN, Env, IntoVal,
};

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

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let reporter = Address::generate(&env);

    let passport_id = env.register(BusinessPassportContract, (admin.clone(), issuer));
    let passport = BusinessPassportContractClient::new(&env, &passport_id);
    let score_id = env.register(CreditScoreContract, (admin.clone(), passport_id.clone()));
    let score = CreditScoreContractClient::new(&env, &score_id);

    // Wiring, as the deploy does it: the score contract is the Passport's
    // reputation manager, and `reporter` stands in for the escrow.
    passport.set_reputation_manager(&score_id);
    score.set_reporter(&reporter);

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

#[test]
fn an_untrusted_address_cannot_report_a_default() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let passport = Address::generate(&env);
    let reporter = Address::generate(&env);
    let attacker = Address::generate(&env);
    let business = Address::generate(&env);
    let contract_id = env.register(CreditScoreContract, (admin, passport));
    let client = CreditScoreContractClient::new(&env, &contract_id);
    env.mock_all_auths();
    client.set_reporter(&reporter);

    env.mock_auths(&[MockAuth {
        address: &attacker,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "on_default",
            args: (business.clone(),).into_val(&env),
            sub_invokes: &[],
        },
    }]);

    // Authentication must fail before the missing Passport is even queried.
    assert_ne!(
        client.try_on_default(&business),
        Err(Ok(Error::PassportNotFound))
    );
    assert!(client.try_on_default(&business).is_err());
}

#[test]
fn nobody_can_report_until_the_reporter_is_wired() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let passport = Address::generate(&env);
    let id = env.register(CreditScoreContract, (admin.clone(), passport.clone()));
    let client = CreditScoreContractClient::new(&env, &id);
    assert_eq!(client.admin(), admin);
    assert_eq!(client.passport(), passport);
    assert_eq!(client.try_reporter(), Err(Ok(Error::NotInitialized)));
    let business = Address::generate(&env);
    assert_eq!(
        client.try_on_default(&business),
        Err(Ok(Error::NotInitialized))
    );
}

#[test]
fn admin_handover_is_two_step() {
    let f = setup(500);
    let next = Address::generate(&f.env);
    assert_eq!(f.score.try_accept_admin(), Err(Ok(Error::NoPendingAdmin)));
    f.score.propose_admin(&next);
    assert_eq!(f.score.pending_admin(), Some(next.clone()));
    f.score.accept_admin();
    assert_eq!(f.score.admin(), next);
    assert_eq!(f.score.pending_admin(), None);
}
