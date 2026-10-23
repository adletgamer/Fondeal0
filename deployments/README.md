# Testnet deployments

The one place that says which contracts are current. Stellar **Testnet** only: no real value, and Testnet is reset periodically, so every id here is temporary. Anything not listed under *Current* is not Fondealo's deployment.

## Current

Declared by the product owner on 2026-10-23. Use only these ids in Vercel (`NEXT_PUBLIC_PASSPORT_CONTRACT_ID`, `NEXT_PUBLIC_SCORE_CONTRACT_ID`, `NEXT_PUBLIC_ESCROW_CONTRACT_ID`), in demos and in the hackathon form.

| Name | Contract | Id |
| --- | --- | --- |
| PASSPORT | `business_passport` | `CDT5FU7BD7GJD4736CDP2AZQU2UT7ZGVZFNM3VJC3MKYL64XDB5ZHVNC` |
| REPUTATION | `credit_score` crate (the Reputation Engine) | `CDJS4NHO2REPNLHGIF4BBM54OBAOEPBQQNYNX3KXWVVPK6ORKLX3LUUX` |
| ESCROW | `loan_escrow` | `CCAEHBJRX5OYCVRAEKWIGWSZC3JGEZRXAMH45OEYO7I7WFZBIZJEU3OC` |

**Verification status: not yet verified from this repository.** The ids have valid checksums, but nobody has checked on-chain which code they run, who controls them, or that they are wired together. Until that is done, call them _declared_, not _verified_. To verify, from the repository root on this branch, with the manifest produced by the deploy:

```bash
./scripts/verify_testnet.sh deployments/testnet.json
```

A pass means the roles, the wiring and the Wasm hashes match the manifest, and that the contracts are the hardened version ([ADR-0012](../docs/adr/0012-contract-initialization-roles-and-funds-safety.md)). A failure on a getter such as `paused` or `passport` on the escrow means these ids run the earlier, pre-hardening code. Commit `deployments/testnet.json` (roles, token, Wasm hashes, Git commit) next to this file once it exists.

## Deprecated test deployments

Do not use, do not reference. Kept only so nobody mistakes them for current.

| Deployed | Contracts | Notes |
| --- | --- | --- |
| 2026-10-23, earlier script | PASSPORT `CCOKNKSGIZBERI2BLJOQFG3YMBKRIWFKHBJAZQT5TA2XCSWHPBT4DPC7`<br>REPUTATION `CAQF4APKNA7HTWVB4U5RKUCKHQSZGDBKZ3B7ACJ2HWJGUAMIMCMDIEZS`<br>ESCROW `CD6JIJKTQMR7CEVPJ2H7RZONLNUL232JVMNTN5ZIZIU6T4AJJT77NN6X` | Pre-hardening ABI (a public `init`, no `cancel`, no pause, no eligibility check in the escrow), from `feat/landing-v2-base`. Deployer account `GBAAVPU7R7C7HGES4JK35I2POTABHG4TSS2DSZNXFB5NV33V2P2TRTOZ`. |

## Rules

- Exactly one deployment is *Current*. Never edit a deployed contract's row to point at new ids.
- To redeploy, move the *Current* rows to *Deprecated* (with the date and why) and add the new ones, in the same commit as the new `testnet.json`.
- Anything that reads contract ids takes them from the *Current* table or from `testnet.json`, never from memory or chat.
- A capability may be labelled **Testnet** only after `verify_testnet.sh` passes against the current ids ([operating model](../docs/operating-model.md)).
- After a Testnet reset all ids stop existing. Deploy again and update this file.

Runbook: [`docs/testnet-deployment.md`](../docs/testnet-deployment.md).
