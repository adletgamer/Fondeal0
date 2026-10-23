# Testnet deployments

The one place that says which contracts are current. Stellar **Testnet** only: no real value, and Testnet is reset periodically, so every id here is temporary. Anything not listed under *Current* is not Fondealo's deployment.

## Current

Deployed to Stellar Testnet on 2026-10-23 from commit `57c99de` of the branch of [PR #23](https://github.com/adletgamer/Fondeal0/pull/23), with `scripts/deploy_testnet.sh`. Use only these ids in Vercel (`NEXT_PUBLIC_PASSPORT_CONTRACT_ID`, `NEXT_PUBLIC_SCORE_CONTRACT_ID`, `NEXT_PUBLIC_ESCROW_CONTRACT_ID`), in demos and in the hackathon form.

| Name | Contract | Id | Wasm hash |
| --- | --- | --- | --- |
| PASSPORT | `business_passport` | `CCUTBEZ325I4WDCS5UJO23Z5Z2JVFSR3E5HPGJRTV2R3NGBWA54MJ6LN` | `8a380a5b84ee86b48941b849ff5c08c49f752052d0f6fcb01af5bf61b983367c` |
| REPUTATION | `credit_score` crate (the Reputation Engine) | `CBHXDATTXZ35HTWCWPLSKKCA5BMLF4KCYOBFHOJBKPZBDO6WR3JJDTN3` | `a2d4a98d41d8ca9cea1d0683d639c0cca323dd00c3a77f29b9b2053009df131f` |
| ESCROW | `loan_escrow` | `CB62PDPQQSU6QEOANOXJLN2642LECNJPAXB3E6TQDIO5QXUEKFKLJITY` | `e7824fb12be2261de0cb89e89506d1a556a867a0097b67a50d97cd02d5665ebc` |

Escrowed token: Circle's Testnet USDC, Stellar Asset Contract `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` (issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`).

Roles (three different accounts; the secrets live only in the owner's stellar-cli keystore as `fondealo-admin`, `fondealo-issuer` and `fondealo-keeper`):

| Role | Account |
| --- | --- |
| admin (pays for deployment, rotates roles) | `GD3E2HEMKTQ2N4KEVG6ZNVV2NC5YOWZTVAMGJXZJKA3TTMJ47CJHSRQT` |
| issuer (issues Passports and credentials) | `GDKXQFREA76LXIH7Y2SLDTZCG65GD5QMWQQASYSZHGHDKLRESG6TY4ZG` |
| keeper (defaults overdue loans, unwinds ineligible ones) | `GCAEGXX7ETCXRTRCJQEWQV6TFCGMYIEHZFIKJSV6CPYSZCIKX3DNI6V3` |

**Verified.** The owner ran `scripts/verify_testnet.sh` against Testnet and shared the output (stellar-cli 28.0.0, Windows): all 17 checks passed. That covers the admin and keeper of each contract, the Passport's issuer and reputation manager, the Score's passport and reporter, the escrow's passport, score and token, that the escrow is not paused, that admin is neither issuer nor keeper, and that the Wasm fetched from the network hashes to the values above. This was not re-run from this repository.

**What this proves, and what it does not.** It proves the hardened contracts of [ADR-0012](../docs/adr/0012-contract-initialization-roles-and-funds-safety.md) are on Testnet, set up by their constructors, wired together, with separate roles. The behaviours themselves (eligibility gate, cancel and refund, pause, credential expiry) are covered by the 72 contract tests and by a rehearsal on a local network, not by a loan cycle run on Testnet. The app does not issue Passports on-chain yet, and its chain reads of the escrow still fail over to the database ([backlog E9](../docs/backlog.md)). Keep claims to what is deployed and verified.

Commit `deployments/testnet.json` (roles, token, Wasm hashes, Git commit, CLI version) next to this file; it is written by the deploy script.

The Wasm hash depends on the machine that builds. Builds on Linux of the same commit give different hashes; compare against the chain, not across machines.

## Deprecated test deployments

Do not use, do not reference. Kept only so nobody mistakes them for current. Both were deployed with the earlier, pre-hardening script from `feat/landing-v2-base`, by the single deployer account `GBAAVPU7R7C7HGES4JK35I2POTABHG4TSS2DSZNXFB5NV33V2P2TRTOZ`, which also acted as keeper. They have a public `init`, no eligibility check in the escrow, no cancel, no pause and no role separation.

| Deployed | PASSPORT | REPUTATION | ESCROW | Notes |
| --- | --- | --- | --- | --- |
| 2026-10-23, second run | `CDT5FU7BD7GJD4736CDP2AZQU2UT7ZGVZFNM3VJC3MKYL64XDB5ZHVNC` | `CDJS4NHO2REPNLHGIF4BBM54OBAOEPBQQNYNX3KXWVVPK6ORKLX3LUUX` | `CCAEHBJRX5OYCVRAEKWIGWSZC3JGEZRXAMH45OEYO7I7WFZBIZJEU3OC` | Briefly declared current. Wiring was confirmed on-chain by the owner. Superseded by the hardened deployment above. |
| 2026-10-23, first run | `CCOKNKSGIZBERI2BLJOQFG3YMBKRIWFKHBJAZQT5TA2XCSWHPBT4DPC7` | `CAQF4APKNA7HTWVB4U5RKUCKHQSZGDBKZ3B7ACJ2HWJGUAMIMCMDIEZS` | `CD6JIJKTQMR7CEVPJ2H7RZONLNUL232JVMNTN5ZIZIU6T4AJJT77NN6X` | Wiring confirmed on-chain by the owner. |

## Rules

- Exactly one deployment is *Current*. Never edit a deployed contract's row to point at new ids.
- To redeploy, move the *Current* rows to *Deprecated* (with the date and why) and add the new ones, in the same commit as the new `testnet.json`.
- Anything that reads contract ids takes them from the *Current* table or from `testnet.json`, never from memory or chat.
- A capability may be labelled **Testnet** only with on-chain evidence for it: `verify_testnet.sh` passing against the current ids for what the deployment is, and a dated Testnet run for any behaviour ([operating model](../docs/operating-model.md)).
- After a Testnet reset all ids stop existing. Deploy again and update this file.

Runbook: [`docs/testnet-deployment.md`](../docs/testnet-deployment.md).
