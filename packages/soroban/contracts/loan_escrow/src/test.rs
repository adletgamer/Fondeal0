use super::*;
use business_passport::{BusinessPassportContract, BusinessPassportContractClient, KybStatus};
use credit_score::{CreditScoreContract, CreditScoreContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _, MockAuth, MockAuthInvoke},
    token::StellarAssetClient,
    Address, BytesN, Env, IntoVal,
};

const ONE_USDC: i128 = 10_000_000;

struct Fixture {
    env: Env,
    escrow: LoanEscrowContractClient<'static>,
    passport: BusinessPassportContractClient<'static>,
    score: CreditScoreContractClient<'static>,
    token: token::Client<'static>,
    token_admin: StellarAssetClient<'static>,
    admin: Address,
    keeper: Address,
    business: Address,
}

/// Deploy + wire passport, score, escrow, and a test USDC token; issue a
/// Passport for one business at `start_score` (band derived the same way
/// the real Passport contract derives it).
fn setup(start_score: u32) -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let keeper = Address::generate(&env);

    let token_admin_addr = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin_addr.clone());
    let token_address = token_contract.address();
    let token = token::Client::new(&env, &token_address);
    let token_admin = StellarAssetClient::new(&env, &token_address);

    // Deploy in the order the deploy script uses, each with its constructor.
    let passport_id = env.register(BusinessPassportContract, (admin.clone(), issuer.clone()));
    let passport = BusinessPassportContractClient::new(&env, &passport_id);
    let score_id = env.register(CreditScoreContract, (admin.clone(), passport_id.clone()));
    let score = CreditScoreContractClient::new(&env, &score_id);
    let escrow_id = env.register(
        LoanEscrowContract,
        (
            admin.clone(),
            passport_id.clone(),
            score_id.clone(),
            token_address.clone(),
            keeper.clone(),
        ),
    );
    let escrow = LoanEscrowContractClient::new(&env, &escrow_id);

    // Wire: score is the Passport's reputation manager, escrow is score's reporter.
    passport.set_reputation_manager(&score_id);
    score.set_reporter(&escrow_id);

    let business = Address::generate(&env);
    let data_hash = BytesN::from_array(&env, &[9u8; 32]);
    passport.issue(&business, &KybStatus::Accepted, &start_score, &data_hash);

    // Fund the business with plenty of USDC to post collateral / repay from.
    token_admin.mint(&business, &(1_000_000 * ONE_USDC));

    Fixture {
        env,
        escrow,
        passport,
        score,
        token,
        token_admin,
        admin,
        keeper,
        business,
    }
}

impl Fixture {
    fn investor_with(&self, amount: i128) -> Address {
        let investor = Address::generate(&self.env);
        self.token_admin.mint(&investor, &amount);
        investor
    }

    /// Open + fully-fund + release a standard 100 USDC / band-C / 90-day / 18% APR loan.
    fn open_and_release(&self, opportunity_id: u64, investors: &[(&Address, i128)]) {
        let principal = 100 * ONE_USDC;
        let collateral = principal / 2; // band C (new business, score 500) = 50%
        self.escrow.create(
            &opportunity_id,
            &self.business,
            &principal,
            &90,
            &collateral,
            &1800,
        );
        for (investor, amount) in investors {
            self.escrow.fund(&opportunity_id, investor, amount);
        }
        self.escrow.release(&opportunity_id);
    }
}

#[test]
fn escrow_is_wired_as_the_score_reporter() {
    let f = setup(500);
    assert_eq!(f.score.reporter(), f.escrow.address);
}

#[test]
fn create_locks_collateral_matching_the_business_band() {
    let f = setup(500); // band C -> 50%
    let principal = 100 * ONE_USDC;
    let collateral = 50 * ONE_USDC;
    let business_balance_before = f.token.balance(&f.business);

    f.escrow
        .create(&1, &f.business, &principal, &90, &collateral, &2000);

    assert_eq!(
        f.token.balance(&f.business),
        business_balance_before - collateral
    );
    assert_eq!(f.token.balance(&f.escrow.address), collateral);
    let o = f.escrow.get_opportunity(&1).unwrap();
    assert_eq!(o.status, OpportunityStatus::Open);
    assert_eq!(o.collateral_amount, collateral);
}

#[test]
fn create_rejects_wrong_collateral_for_band() {
    let f = setup(500); // band C -> 50% -> 50 USDC required on 100 USDC
    let res = f.escrow.try_create(
        &1,
        &f.business,
        &(100 * ONE_USDC),
        &90,
        &(20 * ONE_USDC),
        &2000,
    );
    assert_eq!(res, Err(Ok(Error::CollateralMismatch)));
}

#[test]
fn create_fails_without_a_passport() {
    let f = setup(500);
    let stranger = Address::generate(&f.env);
    f.token_admin.mint(&stranger, &(1_000 * ONE_USDC));
    let res = f.escrow.try_create(
        &1,
        &stranger,
        &(100 * ONE_USDC),
        &90,
        &(50 * ONE_USDC),
        &2000,
    );
    assert_eq!(res, Err(Ok(Error::PassportNotFound)));
}

#[test]
fn partial_funding_keeps_the_opportunity_open() {
    let f = setup(500);
    f.escrow.create(
        &1,
        &f.business,
        &(100 * ONE_USDC),
        &90,
        &(50 * ONE_USDC),
        &2000,
    );

    let investor = f.investor_with(40 * ONE_USDC);
    f.escrow.fund(&1, &investor, &(40 * ONE_USDC));

    let o = f.escrow.get_opportunity(&1).unwrap();
    assert_eq!(o.status, OpportunityStatus::Open);
    assert_eq!(o.funded, 40 * ONE_USDC);
    assert_eq!(f.escrow.get_position(&1, &investor), 40 * ONE_USDC);
}

#[test]
fn a_stranger_cannot_fund_using_an_investors_address() {
    let f = setup(500);
    f.escrow.create(
        &1,
        &f.business,
        &(100 * ONE_USDC),
        &90,
        &(50 * ONE_USDC),
        &1800,
    );
    let investor = f.investor_with(100 * ONE_USDC);
    let attacker = Address::generate(&f.env);
    f.env.mock_auths(&[MockAuth {
        address: &attacker,
        invoke: &MockAuthInvoke {
            contract: &f.escrow.address,
            fn_name: "fund",
            args: (1u64, investor.clone(), 10 * ONE_USDC).into_val(&f.env),
            sub_invokes: &[],
        },
    }]);

    assert!(f.escrow.try_fund(&1, &investor, &(10 * ONE_USDC)).is_err());
    assert_eq!(f.escrow.get_position(&1, &investor), 0);
    assert_eq!(f.escrow.get_opportunity(&1).unwrap().funded, 0);
}

#[test]
fn funding_closes_exactly_at_principal_and_rejects_overfunding() {
    let f = setup(500);
    f.escrow.create(
        &1,
        &f.business,
        &(100 * ONE_USDC),
        &90,
        &(50 * ONE_USDC),
        &2000,
    );
    let investor = f.investor_with(200 * ONE_USDC);

    // Still Open after a partial fund...
    f.escrow.fund(&1, &investor, &(60 * ONE_USDC));
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Open
    );

    // ...but a fund call that would push funded past principal is rejected
    // while still Open (a call after it's already Funded instead hits
    // InvalidStatus, since funding is closed at that point — not exercised
    // here, but implied by `Open` staying true above).
    let res = f.escrow.try_fund(&1, &investor, &(50 * ONE_USDC));
    assert_eq!(res, Err(Ok(Error::OverFunding)));

    // Funding exactly the remainder closes it to Funded.
    f.escrow.fund(&1, &investor, &(40 * ONE_USDC));
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Funded
    );
}

#[test]
fn release_pays_principal_and_keeps_collateral_locked() {
    let f = setup(500);
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);

    let o = f.escrow.get_opportunity(&1).unwrap();
    assert_eq!(o.status, OpportunityStatus::Active);
    // Net for the business: -50 collateral posted at create, +100 principal
    // received at release.
    assert_eq!(
        f.token.balance(&f.business),
        1_000_000 * ONE_USDC + 50 * ONE_USDC
    );
    // Escrow still holds the collateral (50) after paying out the 100 principal.
    assert_eq!(f.token.balance(&f.escrow.address), 50 * ONE_USDC);
}

#[test]
fn happy_path_repay_returns_collateral_and_raises_score() {
    let f = setup(500); // band C, 50% collateral
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);

    // total_due = 100 + 100*1800*90/(10000*365) = 100 + ~4.438 USDC.
    let total_due = 100 * ONE_USDC + (100 * ONE_USDC * 1800 * 90) / (10_000 * 365);
    let business_before = f.token.balance(&f.business);

    f.escrow.repay(&1, &total_due);

    let o = f.escrow.get_opportunity(&1).unwrap();
    assert_eq!(o.status, OpportunityStatus::Repaid);

    // Collateral (50 USDC) came back to the business.
    assert_eq!(
        f.token.balance(&f.business),
        business_before - total_due + 50 * ONE_USDC
    );
    // The investor received exactly total_due (sole funder).
    assert_eq!(f.token.balance(&investor), total_due);
    // Escrow is empty again.
    assert_eq!(f.token.balance(&f.escrow.address), 0);

    // Score rose via the external, on-time path.
    let p = f.passport.get(&f.business).unwrap();
    assert!(p.score > 500);
    assert_eq!(p.loans_repaid, 1);
    assert_eq!(p.on_time_streak, 1);
}

#[test]
fn repayment_can_be_split_across_multiple_calls() {
    let f = setup(500);
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);
    let total_due = 100 * ONE_USDC + (100 * ONE_USDC * 1800 * 90) / (10_000 * 365);

    f.escrow.repay(&1, &(total_due / 2));
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Active
    );
    assert_eq!(f.token.balance(&investor), 0); // nothing distributed until the final payment

    f.escrow.repay(&1, &(total_due - total_due / 2));
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Repaid
    );
    assert_eq!(f.token.balance(&investor), total_due);
}

#[test]
fn repay_rejects_amounts_beyond_what_is_due() {
    let f = setup(500);
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);
    let total_due = 100 * ONE_USDC + (100 * ONE_USDC * 1800 * 90) / (10_000 * 365);

    let res = f.escrow.try_repay(&1, &(total_due + 1));
    assert_eq!(res, Err(Ok(Error::RepaymentExceedsDue)));
}

#[test]
fn late_repayment_does_not_raise_score_via_on_time_path() {
    let f = setup(500);
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);
    let total_due = 100 * ONE_USDC + (100 * ONE_USDC * 1800 * 90) / (10_000 * 365);

    // Jump past the due date before the (single, final) repayment.
    f.env
        .ledger()
        .set_timestamp(f.env.ledger().timestamp() + 91 * 86_400);
    f.escrow.repay(&1, &total_due);

    // Late-but-external repayment: -30 flat penalty per docs/score-spec.md.
    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, 470);
    assert_eq!(p.on_time_streak, 0);
}

#[test]
fn pro_rata_distribution_splits_by_contribution_on_repayment() {
    let f = setup(500);
    let big = f.investor_with(70 * ONE_USDC);
    let small = f.investor_with(30 * ONE_USDC);
    f.open_and_release(1, &[(&big, 70 * ONE_USDC), (&small, 30 * ONE_USDC)]);
    let total_due = 100 * ONE_USDC + (100 * ONE_USDC * 1800 * 90) / (10_000 * 365);

    f.escrow.repay(&1, &total_due);

    let big_payout = f.token.balance(&big);
    let small_payout = f.token.balance(&small);
    assert_eq!(big_payout + small_payout, total_due); // no dust lost
    assert_eq!(big_payout, (total_due * 70 * ONE_USDC) / (100 * ONE_USDC));
    assert_eq!(small_payout, total_due - big_payout);
}

#[test]
fn default_seizes_collateral_pro_rata_after_due_and_grace() {
    let f = setup(500);
    let big = f.investor_with(70 * ONE_USDC);
    let small = f.investor_with(30 * ONE_USDC);
    f.open_and_release(1, &[(&big, 70 * ONE_USDC), (&small, 30 * ONE_USDC)]);
    let score_before = f.passport.get(&f.business).unwrap().score;

    // Past due_at (90d) + grace (7d).
    f.env
        .ledger()
        .set_timestamp(f.env.ledger().timestamp() + 98 * 86_400);
    f.escrow.default(&1);

    let o = f.escrow.get_opportunity(&1).unwrap();
    assert_eq!(o.status, OpportunityStatus::Defaulted);

    let collateral = 50 * ONE_USDC;
    let big_payout = f.token.balance(&big);
    let small_payout = f.token.balance(&small);
    assert_eq!(big_payout + small_payout, collateral); // pro-rata over the seized collateral
    assert_eq!(big_payout, (collateral * 70 * ONE_USDC) / (100 * ONE_USDC));
    assert_eq!(f.token.balance(&f.escrow.address), 0);

    // credit_score.on_default applied: -150 flat, per docs/score-spec.md.
    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, score_before - 150);
    assert_eq!(p.loans_repaid, 0);
}

#[test]
fn default_before_due_and_grace_is_rejected() {
    let f = setup(500);
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);

    let res = f.escrow.try_default(&1);
    assert_eq!(res, Err(Ok(Error::NotYetDue)));
}

#[test]
fn default_requires_the_keepers_signature() {
    let f = setup(500);
    let investor = f.investor_with(100 * ONE_USDC);
    f.open_and_release(1, &[(&investor, 100 * ONE_USDC)]);
    f.env
        .ledger()
        .set_timestamp(f.env.ledger().timestamp() + 98 * 86_400);
    let stranger = Address::generate(&f.env);
    f.env.mock_auths(&[MockAuth {
        address: &stranger,
        invoke: &MockAuthInvoke {
            contract: &f.escrow.address,
            fn_name: "default",
            args: (1u64,).into_val(&f.env),
            sub_invokes: &[],
        },
    }]);
    assert!(f.escrow.try_default(&1).is_err());
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Active
    );
}

#[test]
fn external_is_true_the_moment_any_real_investor_funds_even_alongside_the_business() {
    // Anti-gaming fix (docs/product-v2.md §5): `external` is derived from
    // actual funder identities, so a business can't dilute a mostly-self-
    // funded loan to fake a real one — but the reverse also can't happen:
    // as soon as *any* distinct investor contributes, the loan is correctly
    // external=true, even if the business also co-funded part of it.
    let f = setup(500);
    let principal = 100 * ONE_USDC;
    let collateral = 50 * ONE_USDC;
    f.escrow
        .create(&1, &f.business, &principal, &90, &collateral, &1800);

    // The business funds 99% of its own loan...
    f.escrow.fund(&1, &f.business, &(99 * ONE_USDC));
    // ...and one real investor funds the remaining 1%.
    let investor = f.investor_with(ONE_USDC);
    f.escrow.fund(&1, &investor, &ONE_USDC);
    f.escrow.release(&1);

    let total_due = principal + (principal * 1800 * 90) / (10_000 * 365);
    f.escrow.repay(&1, &total_due);

    // external=true was used (score rose along the on-time-external curve),
    // not silently defeated by the business supplying almost all the capital.
    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, 520); // headroom 500, streak 0: 500 + 40*500/1000
    assert_eq!(p.on_time_streak, 1);
}

#[test]
fn wholly_self_funded_loan_is_score_neutral() {
    // Contrast case: no external funder at all -> on_repayment sees
    // external=false and the score does not move, per docs/score-spec.md
    // (R-01 anti-gaming: self-funded round trips are score-neutral).
    let f = setup(500);
    let principal = 100 * ONE_USDC;
    let collateral = 50 * ONE_USDC;
    f.escrow
        .create(&1, &f.business, &principal, &90, &collateral, &1800);
    f.escrow.fund(&1, &f.business, &principal);
    f.escrow.release(&1);

    let total_due = principal + (principal * 1800 * 90) / (10_000 * 365);
    f.escrow.repay(&1, &total_due);

    let p = f.passport.get(&f.business).unwrap();
    assert_eq!(p.score, 500); // unchanged
    assert_eq!(p.on_time_streak, 0);
}

// ---------------------------------------------------------------------------
// Eligibility, pause, cancellation and never-trapped funds
// ---------------------------------------------------------------------------

const PRINCIPAL: i128 = 100 * ONE_USDC;
const COLLATERAL: i128 = 50 * ONE_USDC; // band C

impl Fixture {
    fn open(&self, id: u64) {
        self.escrow
            .create(&id, &self.business, &PRINCIPAL, &90, &COLLATERAL, &1800);
    }
}

#[test]
#[should_panic(expected = "Error(Contract, #15)")]
fn admin_cannot_also_be_the_keeper() {
    let env = Env::default();
    let same = Address::generate(&env);
    let other = Address::generate(&env);
    env.register(
        LoanEscrowContract,
        (same.clone(), other.clone(), other.clone(), other, same),
    );
}

#[test]
fn constructor_records_every_address() {
    let f = setup(500);
    assert_eq!(f.escrow.admin(), f.admin);
    assert_eq!(f.escrow.keeper(), f.keeper);
    assert_eq!(f.escrow.passport(), f.passport.address);
    assert_eq!(f.escrow.score(), f.score.address);
    assert_eq!(f.escrow.token(), f.token.address);
    assert!(!f.escrow.paused());
}

#[test]
fn no_new_opportunity_for_a_frozen_passport_or_unaccepted_kyb() {
    let f = setup(500);
    f.passport.freeze(&f.business);
    assert_eq!(
        f.escrow
            .try_create(&1, &f.business, &PRINCIPAL, &90, &COLLATERAL, &1800),
        Err(Ok(Error::PassportNotActive))
    );
    f.passport.unfreeze(&f.business);
    f.passport.set_kyb(&f.business, &KybStatus::Processing);
    assert_eq!(
        f.escrow
            .try_create(&1, &f.business, &PRINCIPAL, &90, &COLLATERAL, &1800),
        Err(Ok(Error::KybNotAccepted))
    );
}

#[test]
fn no_funding_or_release_once_the_business_is_no_longer_eligible() {
    let f = setup(500);
    let investor = f.investor_with(PRINCIPAL);
    f.open(1);
    f.passport.freeze(&f.business);
    assert_eq!(
        f.escrow.try_fund(&1, &investor, &PRINCIPAL),
        Err(Ok(Error::PassportNotActive))
    );
    f.passport.unfreeze(&f.business);
    f.escrow.fund(&1, &investor, &PRINCIPAL);
    f.passport.freeze(&f.business);
    assert_eq!(f.escrow.try_release(&1), Err(Ok(Error::PassportNotActive)));
}

#[test]
fn keeper_unwinds_a_funded_loan_whose_business_was_frozen() {
    let f = setup(500);
    let a = f.investor_with(70 * ONE_USDC);
    let b = f.investor_with(30 * ONE_USDC);
    let business_before = f.token.balance(&f.business);
    f.open(1);
    f.escrow.fund(&1, &a, &(70 * ONE_USDC));
    f.escrow.fund(&1, &b, &(30 * ONE_USDC));

    // Still eligible: the keeper may not unwind it.
    assert_eq!(f.escrow.try_force_cancel(&1), Err(Ok(Error::StillEligible)));

    f.passport.freeze(&f.business);
    f.escrow.force_cancel(&1);

    assert_eq!(f.token.balance(&a), 70 * ONE_USDC);
    assert_eq!(f.token.balance(&b), 30 * ONE_USDC);
    assert_eq!(f.token.balance(&f.business), business_before);
    assert_eq!(f.token.balance(&f.escrow.address), 0);
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Cancelled
    );
    // Nothing can happen to a cancelled opportunity.
    assert_eq!(f.escrow.try_cancel(&1), Err(Ok(Error::InvalidStatus)));
}

#[test]
fn the_business_can_cancel_before_release_but_not_after() {
    let f = setup(500);
    let investor = f.investor_with(40 * ONE_USDC);
    let business_before = f.token.balance(&f.business);
    f.open(1);
    f.escrow.fund(&1, &investor, &(40 * ONE_USDC));
    f.escrow.cancel(&1);
    assert_eq!(f.token.balance(&investor), 40 * ONE_USDC);
    assert_eq!(f.token.balance(&f.business), business_before);

    let investor2 = f.investor_with(PRINCIPAL);
    f.open_and_release(2, &[(&investor2, PRINCIPAL)]);
    assert_eq!(f.escrow.try_cancel(&2), Err(Ok(Error::InvalidStatus)));
}

#[test]
fn pause_stops_new_activity_but_never_repayment_or_cancellation() {
    let f = setup(500);
    let investor = f.investor_with(PRINCIPAL);
    f.open_and_release(1, &[(&investor, PRINCIPAL)]);
    let other = f.investor_with(10 * ONE_USDC);
    f.open(2);
    f.escrow.fund(&2, &other, &(10 * ONE_USDC));

    f.escrow.set_paused(&true);
    assert!(f.escrow.paused());
    assert_eq!(
        f.escrow
            .try_create(&3, &f.business, &PRINCIPAL, &90, &COLLATERAL, &1800),
        Err(Ok(Error::Paused))
    );
    assert_eq!(
        f.escrow.try_fund(&2, &other, &ONE_USDC),
        Err(Ok(Error::Paused))
    );

    // Obligations and exits keep working.
    let total_due = PRINCIPAL + PRINCIPAL * 1800 * 90 / (10_000 * 365);
    f.escrow.repay(&1, &total_due);
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Repaid
    );
    f.escrow.cancel(&2);
    assert_eq!(f.token.balance(&other), 10 * ONE_USDC);

    f.escrow.set_paused(&false);
    f.open(3);
}

#[test]
fn a_frozen_passport_never_traps_the_final_repayment() {
    let f = setup(500);
    let investor = f.investor_with(PRINCIPAL);
    f.open_and_release(1, &[(&investor, PRINCIPAL)]);
    let score_before = f.passport.get(&f.business).unwrap().score;
    f.passport.freeze(&f.business);

    let total_due = PRINCIPAL + PRINCIPAL * 1800 * 90 / (10_000 * 365);
    f.escrow.repay(&1, &total_due);

    let o = f.escrow.get_opportunity(&1).unwrap();
    assert_eq!(o.status, OpportunityStatus::Repaid);
    assert_eq!(f.token.balance(&investor), total_due);
    assert_eq!(f.token.balance(&f.escrow.address), 0);
    // The reputation update could not apply to a frozen Passport; the money moved anyway.
    assert_eq!(f.passport.get(&f.business).unwrap().score, score_before);
}

#[test]
fn a_frozen_passport_never_blocks_a_default() {
    let f = setup(500);
    let investor = f.investor_with(PRINCIPAL);
    f.open_and_release(1, &[(&investor, PRINCIPAL)]);
    f.passport.freeze(&f.business);
    f.env
        .ledger()
        .set_timestamp(f.env.ledger().timestamp() + 98 * 86_400);
    f.escrow.default(&1);
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Defaulted
    );
    assert_eq!(f.token.balance(&investor), COLLATERAL);
}

#[test]
fn keeper_and_admin_stay_separate_and_admin_handover_is_two_step() {
    let f = setup(500);
    assert_eq!(
        f.escrow.try_set_keeper(&f.admin),
        Err(Ok(Error::RolesMustDiffer))
    );
    f.escrow.propose_admin(&f.keeper);
    assert_eq!(f.escrow.try_accept_admin(), Err(Ok(Error::RolesMustDiffer)));
    let next = Address::generate(&f.env);
    f.escrow.propose_admin(&next);
    f.escrow.accept_admin();
    assert_eq!(f.escrow.admin(), next);
    assert_eq!(f.escrow.pending_admin(), None);
}

#[test]
fn only_the_admin_pauses_and_only_the_keeper_force_cancels() {
    let f = setup(500);
    f.open(1);
    f.passport.freeze(&f.business);
    let stranger = Address::generate(&f.env);

    f.env.mock_auths(&[MockAuth {
        address: &stranger,
        invoke: &MockAuthInvoke {
            contract: &f.escrow.address,
            fn_name: "set_paused",
            args: (true,).into_val(&f.env),
            sub_invokes: &[],
        },
    }]);
    assert!(f.escrow.try_set_paused(&true).is_err());

    f.env.mock_auths(&[MockAuth {
        address: &stranger,
        invoke: &MockAuthInvoke {
            contract: &f.escrow.address,
            fn_name: "force_cancel",
            args: (1u64,).into_val(&f.env),
            sub_invokes: &[],
        },
    }]);
    assert!(f.escrow.try_force_cancel(&1).is_err());

    f.env.mock_auths(&[MockAuth {
        address: &stranger,
        invoke: &MockAuthInvoke {
            contract: &f.escrow.address,
            fn_name: "cancel",
            args: (1u64,).into_val(&f.env),
            sub_invokes: &[],
        },
    }]);
    assert!(f.escrow.try_cancel(&1).is_err());
    assert_eq!(
        f.escrow.get_opportunity(&1).unwrap().status,
        OpportunityStatus::Open
    );
}
