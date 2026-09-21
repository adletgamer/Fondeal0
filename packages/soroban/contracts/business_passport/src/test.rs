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

// ---------------------------------------------------------------------------
// Non-transferable credential: identity, status and credentials
// ---------------------------------------------------------------------------

extern crate std;

use soroban_sdk::{
    symbol_short,
    testutils::{MockAuth, MockAuthInvoke},
    IntoVal,
};

fn uri(env: &Env, s: &str) -> String {
    String::from_str(env, s)
}

fn issue_default(f: &Fixture) -> Address {
    let business = Address::generate(&f.env);
    f.client
        .issue(&business, &KybStatus::Accepted, &720, &hash(&f.env));
    business
}

#[test]
fn issue_assigns_sequential_ids_and_binds_the_owner() {
    let f = setup();
    let a = issue_default(&f);
    let b = issue_default(&f);

    let pa = f.client.get(&a).unwrap();
    let pb = f.client.get(&b).unwrap();
    assert_eq!(pa.passport_id, 1);
    assert_eq!(pb.passport_id, 2);
    assert_eq!(pa.owner, a);
    assert_eq!(pb.owner, b);
    assert_eq!(pa.status, PassportStatus::Active);
    assert_eq!(pa.metadata_uri, uri(&f.env, ""));
    assert!(f.client.is_active(&a));
}

#[test]
fn owner_updates_only_their_own_metadata_and_no_credit_field_moves() {
    let f = setup();
    let business = issue_default(&f);
    let before = f.client.get(&business).unwrap();

    f.client.update_metadata(
        &business,
        &uri(&f.env, "https://fondealo.vercel.app/api/passport/x"),
    );
    // The authorisation recorded for this call is the owner's, not the issuer's.
    assert_eq!(f.env.auths()[0].0, business);

    let after = f.client.get(&business).unwrap();
    assert_eq!(
        after.metadata_uri,
        uri(&f.env, "https://fondealo.vercel.app/api/passport/x")
    );
    assert_eq!(after.owner, before.owner);
    assert_eq!(after.passport_id, before.passport_id);
    assert_eq!(after.score, before.score);
    assert_eq!(after.risk_band, before.risk_band);
    assert_eq!(after.kyb_status, before.kyb_status);
    assert_eq!(after.loans_total, before.loans_total);
    assert_eq!(after.loans_repaid, before.loans_repaid);
    assert_eq!(after.on_time_streak, before.on_time_streak);
    assert_eq!(after.data_hash, before.data_hash);
}

#[test]
fn someone_else_cannot_update_the_metadata() {
    // No `mock_all_auths` here: only the addresses we explicitly authorise sign.
    let env = Env::default();
    let contract_id = env.register(BusinessPassportContract, ());
    let client = BusinessPassportContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let manager = Address::generate(&env);
    let business = Address::generate(&env);
    let attacker = Address::generate(&env);
    client.init(&admin, &issuer, &manager);

    env.mock_auths(&[MockAuth {
        address: &issuer,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "issue",
            args: (
                business.clone(),
                KybStatus::Accepted,
                720u32,
                BytesN::from_array(&env, &[7u8; 32]),
            )
                .into_val(&env),
            sub_invokes: &[],
        },
    }]);
    client.issue(
        &business,
        &KybStatus::Accepted,
        &720,
        &BytesN::from_array(&env, &[7u8; 32]),
    );

    let evil = String::from_str(&env, "https://evil.example");
    env.mock_auths(&[MockAuth {
        address: &attacker,
        invoke: &MockAuthInvoke {
            contract: &contract_id,
            fn_name: "update_metadata",
            args: (business.clone(), evil.clone()).into_val(&env),
            sub_invokes: &[],
        },
    }]);
    assert!(client.try_update_metadata(&business, &evil).is_err());
    assert_eq!(
        client.get(&business).unwrap().metadata_uri,
        String::from_str(&env, "")
    );
}

#[test]
fn metadata_length_is_capped() {
    let f = setup();
    let business = issue_default(&f);

    let ok = "a".repeat(MAX_METADATA_URI_LEN as usize);
    f.client.update_metadata(&business, &uri(&f.env, &ok));

    let too_long = "a".repeat(MAX_METADATA_URI_LEN as usize + 1);
    let res = f
        .client
        .try_update_metadata(&business, &uri(&f.env, &too_long));
    assert_eq!(res, Err(Ok(Error::MetadataTooLong)));
}

#[test]
fn metadata_update_needs_an_existing_passport() {
    let f = setup();
    let stranger = Address::generate(&f.env);
    let res = f
        .client
        .try_update_metadata(&stranger, &uri(&f.env, "https://x"));
    assert_eq!(res, Err(Ok(Error::PassportNotFound)));
}

#[test]
fn freeze_blocks_changes_but_stays_readable_and_is_reversible() {
    let f = setup();
    let business = issue_default(&f);

    f.client.freeze(&business);
    assert_eq!(f.env.auths()[0].0, f.issuer);
    assert_eq!(
        f.client.get(&business).unwrap().status,
        PassportStatus::Frozen
    );
    assert!(!f.client.is_active(&business));

    assert_eq!(
        f.client.try_apply_reputation(&business, &800, &1, &1, &1),
        Err(Ok(Error::PassportFrozen))
    );
    assert_eq!(
        f.client.try_update_metadata(&business, &uri(&f.env, "x")),
        Err(Ok(Error::PassportFrozen))
    );
    assert_eq!(
        f.client
            .try_add_credential(&business, &symbol_short!("tax_reg"), &hash(&f.env)),
        Err(Ok(Error::PassportFrozen))
    );
    // Score is unchanged while frozen.
    assert_eq!(f.client.get(&business).unwrap().score, 720);

    // Freezing twice is not a valid transition.
    assert_eq!(
        f.client.try_freeze(&business),
        Err(Ok(Error::InvalidStatusTransition))
    );

    f.client.unfreeze(&business);
    assert!(f.client.is_active(&business));
    f.client.apply_reputation(&business, &800, &1, &1, &1);
    assert_eq!(f.client.get(&business).unwrap().score, 800);
}

#[test]
fn unfreeze_requires_a_frozen_passport() {
    let f = setup();
    let business = issue_default(&f);
    assert_eq!(
        f.client.try_unfreeze(&business),
        Err(Ok(Error::InvalidStatusTransition))
    );
}

#[test]
fn revoke_is_terminal() {
    let f = setup();
    let business = issue_default(&f);

    f.client.revoke(&business);
    assert_eq!(
        f.client.get(&business).unwrap().status,
        PassportStatus::Revoked
    );
    assert!(!f.client.is_active(&business));

    assert_eq!(
        f.client.try_unfreeze(&business),
        Err(Ok(Error::PassportRevoked))
    );
    assert_eq!(
        f.client.try_freeze(&business),
        Err(Ok(Error::PassportRevoked))
    );
    assert_eq!(
        f.client.try_apply_reputation(&business, &900, &1, &1, &1),
        Err(Ok(Error::PassportRevoked))
    );
    assert_eq!(
        f.client.try_set_kyb(&business, &KybStatus::Accepted),
        Err(Ok(Error::PassportRevoked))
    );
    assert_eq!(
        f.client.try_revoke(&business),
        Err(Ok(Error::InvalidStatusTransition))
    );
    // A revoked Passport cannot be re-issued to the same business either.
    assert_eq!(
        f.client
            .try_issue(&business, &KybStatus::Accepted, &500, &hash(&f.env)),
        Err(Ok(Error::PassportAlreadyIssued))
    );
}

#[test]
fn a_frozen_passport_can_still_be_revoked() {
    let f = setup();
    let business = issue_default(&f);
    f.client.freeze(&business);
    f.client.revoke(&business);
    assert_eq!(
        f.client.get(&business).unwrap().status,
        PassportStatus::Revoked
    );
}

#[test]
fn credentials_can_be_added_listed_and_revoked() {
    let f = setup();
    let business = issue_default(&f);
    let tax = symbol_short!("tax_reg");
    let ubo = symbol_short!("ubo");

    assert_eq!(f.client.credentials(&business).len(), 0);

    f.client.add_credential(&business, &tax, &hash(&f.env));
    assert_eq!(f.env.auths()[0].0, f.issuer);
    f.client
        .add_credential(&business, &ubo, &BytesN::from_array(&f.env, &[9u8; 32]));

    let all = f.client.credentials(&business);
    assert_eq!(all.len(), 2);
    assert_eq!(all.get(0).unwrap().kind, tax);
    assert_eq!(all.get(1).unwrap().kind, ubo);
    let c = f.client.get_credential(&business, &tax).unwrap();
    assert_eq!(c.issuer, f.issuer);
    assert_eq!(c.status, CredentialStatus::Active);
    assert_eq!(c.data_hash, hash(&f.env));

    f.client.revoke_credential(&business, &tax);
    assert_eq!(
        f.client.get_credential(&business, &tax).unwrap().status,
        CredentialStatus::Revoked
    );
    // Revoked credentials stay listed as an audit trail.
    assert_eq!(f.client.credentials(&business).len(), 2);
    // The other credential is untouched.
    assert_eq!(
        f.client.get_credential(&business, &ubo).unwrap().status,
        CredentialStatus::Active
    );
}

#[test]
fn credential_edge_cases() {
    let f = setup();
    let business = issue_default(&f);
    let tax = symbol_short!("tax_reg");

    // Unknown credential.
    assert_eq!(
        f.client.try_revoke_credential(&business, &tax),
        Err(Ok(Error::CredentialNotFound))
    );
    assert_eq!(f.client.get_credential(&business, &tax), None);

    // Duplicate kind, even after revocation.
    f.client.add_credential(&business, &tax, &hash(&f.env));
    assert_eq!(
        f.client.try_add_credential(&business, &tax, &hash(&f.env)),
        Err(Ok(Error::CredentialAlreadyExists))
    );
    f.client.revoke_credential(&business, &tax);
    assert_eq!(
        f.client.try_add_credential(&business, &tax, &hash(&f.env)),
        Err(Ok(Error::CredentialAlreadyExists))
    );
    assert_eq!(
        f.client.try_revoke_credential(&business, &tax),
        Err(Ok(Error::InvalidStatusTransition))
    );

    // No Passport, no credentials.
    let stranger = Address::generate(&f.env);
    assert_eq!(
        f.client
            .try_add_credential(&stranger, &symbol_short!("x"), &hash(&f.env)),
        Err(Ok(Error::PassportNotFound))
    );
}

#[test]
fn credentials_can_still_be_revoked_while_frozen() {
    let f = setup();
    let business = issue_default(&f);
    let tax = symbol_short!("tax_reg");
    f.client.add_credential(&business, &tax, &hash(&f.env));
    f.client.freeze(&business);
    f.client.revoke_credential(&business, &tax);
    assert_eq!(
        f.client.get_credential(&business, &tax).unwrap().status,
        CredentialStatus::Revoked
    );
}

#[test]
fn credential_count_is_capped() {
    let f = setup();
    let business = issue_default(&f);
    for i in 0..MAX_CREDENTIALS {
        let kind = Symbol::new(&f.env, &std::format!("c{i}"));
        f.client.add_credential(&business, &kind, &hash(&f.env));
    }
    assert_eq!(f.client.credentials(&business).len(), MAX_CREDENTIALS);

    let one_more = Symbol::new(&f.env, "overflow");
    assert_eq!(
        f.client
            .try_add_credential(&business, &one_more, &hash(&f.env)),
        Err(Ok(Error::TooManyCredentials))
    );
}
