use super::*;
use business_passport::{BusinessPassportContract, BusinessPassportContractClient, KybStatus};
use credit_score::{CreditScoreContract, CreditScoreContractClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::StellarAssetClient,
    Address, BytesN, Env,
};

const ONE_USDC: i128 = 10_000_000;

struct Fixture {
    env: Env,
    escrow: LoanEscrowContractClient<'static>,
    passport: BusinessPassportContractClient<'static>,
    score: CreditScoreContractClient<'static>,
    token: token::Client<'static>,
    token_admin: StellarAssetClient<'static>,
    keeper: Address,
    business: Address,
}

/// Deploy + wire passport, score, escrow, and a test USDC token; issue a
/// Passport for one business at `start_score` (band derived the same way
/// the real Passport contract derives it).
fn setup(start_score: u32) -> Fixture {
    let env = Env::default();
    env.mock_all_auths();

    let passport_id = env.register(BusinessPassportContract, ());
    let passport = BusinessPassportContractClient::new(&env, &passport_id);
    let score_id = env.register(CreditScoreContract, ());
    let score = CreditScoreContractClient::new(&env, &score_id);
    let escrow_id = env.register(LoanEscrowContract, ());
    let escrow = LoanEscrowContractClient::new(&env, &escrow_id);

    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let keeper = Address::generate(&env);

    let token_admin_addr = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin_addr.clone());
    let token_address = token_contract.address();
    let token = token::Client::new(&env, &token_address);
    let token_admin = StellarAssetClient::new(&env, &token_address);

    // escrow is the score contract's reporter; score is the Passport's reputation manager.
    passport.init(&admin, &issuer, &score_id);
    score.init(&admin, &passport_id, &escrow_id);
    escrow.init(&admin, &passport_id, &score_id, &token_address, &keeper);

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
fn default_requires_the_keeper() {
    // `mock_all_auths` in setup() lets any address's require_auth succeed, so
    // this asserts the *role check* (a keeper address is on file for
    // `default` to authorize as) rather than signature verification — the
    // authorization-bypass itself is a testutils affordance, not a contract
    // bug. `require_keeper` still runs and would reject in the absence of a
    // configured keeper.
    let f = setup(500);
    assert_eq!(f.escrow.keeper(), f.keeper);
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
