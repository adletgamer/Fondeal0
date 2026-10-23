# Testnet deployments

The one place that says which contracts are current. Stellar **Testnet** only: no real value, and Testnet is reset periodically, so every id here is temporary. Anything not listed under *Current* is not Fondealo's deployment.

## Current

Declared by the product owner on 2026-10-23. Use only these ids in Vercel (`NEXT_PUBLIC_PASSPORT_CONTRACT_ID`, `NEXT_PUBLIC_SCORE_CONTRACT_ID`, `NEXT_PUBLIC_ESCROW_CONTRACT_ID`), in demos and in the hackathon form.

| Name | Contract | Id |
| --- | --- | --- |
| PASSPORT | `business_passport` | `CDT5FU7BD7GJD4736CDP2AZQU2UT7ZGVZFNM3VJC3MKYL64XDB5ZHVNC` |
| REPUTATION | `credit_score` crate (the Reputation Engine) | `CDJS4NHO2REPNLHGIF4BBM54OBAOEPBQQNYNX3KXWVVPK6ORKLX3LUUX` |
| ESCROW | `loan_escrow` | `CCAEHBJRX5OYCVRAEKWIGWSZC3JGEZRXAMH45OEYO7I7WFZBIZJEU3OC` |

**Code version: pre-hardening.** The deploy output the owner shared shows the earlier script's flow (`6/7 Wire loan_escrow as credit_score's reporter`, `7/7 Write env + manifest`), run from `feat/landing-v2-base`. So these ids run the same earlier ABI as the deprecated ones below, not the hardened contracts of [ADR-0012](../docs/adr/0012-contract-initialization-roles-and-funds-safety.md).

**Checked on-chain by the owner on 2026-10-23** with `stellar contract invoke --send=no` (outputs shared in chat; not re-run from this repository):

| Call | Result | Matches |
| --- | --- | --- |
| `PASSPORT.reputation_manager` | `CDJS4NHO…LUUX` | REPUTATION |
| `REPUTATION.reporter` | `CCAEHBJR…EU3OC` | ESCROW |
| `REPUTATION.passport` | `CDT5FU7B…5ZHVNC` | PASSPORT |
| `ESCROW.keeper` | `GBAAVPU7…2TRTOZ` | the deployer account |

So the three contracts are wired together as intended. **Not checked:** `admin` and `issuer` of each contract, the Wasm hashes, and the escrowed token. The keeper is the deployer account, so on this deployment one key very likely holds every role (the earlier script did not separate them); confirm with `-- admin` and `-- issuer`.

**What may be claimed for these ids:** three connected Soroban contracts on Testnet (Business Passport, Reputation Engine, Loan Escrow), wired as above. **What must not be claimed:** on-chain eligibility gating (active Passport and accepted KYB), cancel and refund, pause, role separation, or credential expiry. Those exist only in the hardened contracts, which are not deployed yet.

`scripts/verify_testnet.sh` is written for the hardened ABI and will fail on these ids (the escrow has no `passport`, `score`, `token` or `paused` getter). That is expected, not a defect in the deployment. To move to the hardened contracts, redeploy from the branch of [PR #23](https://github.com/adletgamer/Fondeal0/pull/23), then move this table to *Deprecated* in the same commit as the new `deployments/testnet.json`.

## Deprecated test deployments

Do not use, do not reference. Kept only so nobody mistakes them for current.

| Deployed | Contracts | Notes |
| --- | --- | --- |
| 2026-10-23, earlier script | PASSPORT `CCOKNKSGIZBERI2BLJOQFG3YMBKRIWFKHBJAZQT5TA2XCSWHPBT4DPC7`<br>REPUTATION `CAQF4APKNA7HTWVB4U5RKUCKHQSZGDBKZ3B7ACJ2HWJGUAMIMCMDIEZS`<br>ESCROW `CD6JIJKTQMR7CEVPJ2H7RZONLNUL232JVMNTN5ZIZIU6T4AJJT77NN6X` | Pre-hardening ABI (a public `init`, no `cancel`, no pause, no eligibility check in the escrow), from `feat/landing-v2-base`. Deployer account `GBAAVPU7R7C7HGES4JK35I2POTABHG4TSS2DSZNXFB5NV33V2P2TRTOZ`. |

## Rules

- Exactly one deployment is *Current*. Never edit a deployed contract's row to point at new ids.
- To redeploy, move the *Current* rows to *Deprecated* (with the date and why) and add the new ones, in the same commit as the new `testnet.json`.
- Anything that reads contract ids takes them from the *Current* table or from `testnet.json`, never from memory or chat.
- A capability may be labelled **Testnet** only with on-chain evidence for it: `verify_testnet.sh` for the hardened contracts, or the owner's dated getter checks above for what they cover ([operating model](../docs/operating-model.md)).
- After a Testnet reset all ids stop existing. Deploy again and update this file.

Runbook: [`docs/testnet-deployment.md`](../docs/testnet-deployment.md).
