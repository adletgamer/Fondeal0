# Verifier network & funding rails — strategy

**Status:** proposal + what the MVP already mocks. Numbers marked _(hypothesis)_ are starting
points to test with pilots, not commitments. Regulatory notes need review by counsel before any
production launch.

## 1. Why this matters

Fondealo's promise is a **portable credit reputation**. A Passport is only as trustworthy as the
party that vouched the business exists (KYB) and is who it says it is. If verification is weak,
every downstream number (score, collateral ratio, APR) is built on sand. If it is slow or costly,
SMEs never onboard. The verifier layer is therefore the product's cold-start problem _and_ its
main fraud surface.

## 2. What comparable platforms do

| Platform | Who verifies borrowers | Who bears first loss | What to borrow |
| --- | --- | --- | --- |
| [Credix](https://docs.credix.finance/other-links-and-resources/faq) (LatAm, Solana) | Deals are underwritten by specialised credit funds after KYC/AML vetting of the originating fintech | Underwriters subscribe to the **junior tranche** ([source](https://medium.com/credix/credix-launches-the-first-of-its-kind-fully-insured-usdc-receivables-pool-with-clave-solana-29b50768225a)) | Verifiers/underwriters with **money at stake**; a track record of repayments feeds later diligence |
| [Goldfinch](https://docs.goldfinch.finance/goldfinch/goldfinch-v1/goldfinch-overview) | Randomly selected **auditors** vote to approve borrowers; every participant needs a unique-entity check (UID, a non-transferable identity NFT) | Backers take first loss on the pool | **Randomised reviewers** + a portable, non-transferable identity credential — close to a Passport |
| [Maple](https://consensys.io/blog/maple-finance-creating-a-decentralized-credit-market) | A single **pool delegate** negotiates terms and underwrites | Delegates stake first-loss capital, aligning incentives | Named, accountable underwriters with skin in the game |
| [Centrifuge](https://www.gemini.com/cryptopedia/centrifuge-crypto-tinlake-tokenization-real-world-assets) | Originators carry KYC/KYB obligations for their counterparties; independent validators check the assets | Structured tranches (senior / junior) | Splitting **originator** (brings borrowers) from **validator** (checks them) |
| TrueFi / Clearpool | Permissioned pools: lenders and borrowers pass KYC/KYB before participating | Pool-specific | Permissioned rails are acceptable to institutional lenders |

**Pattern across all of them:** trust is not bought with a token, it is bought with _accountable
parties who lose money if they are wrong_. Tokens appear later, mostly as a bootstrap for that
staking — not as the trust primitive.

## 3. Proposed design: a three-layer verifier network

```
Layer 1  Verification vendors     -> automated KYB, registry + sanctions/AML checks  (fast, cheap)
Layer 2  Local verifier partners  -> human, on-the-ground vouching (chambers, accountants, fintechs)  (bonded)
Layer 3  Underwriters / backers   -> credit judgement + first-loss capital  (later; Credix/Maple-style)
```

- **Layer 1 — vendors.** Plug in KYB providers behind one interface. LatAm-first options exist
  (see [regional comparison](https://didit.me/blog/top-kyc-providers-latam/)): registry-native
  vendors with coverage in Mexico, Colombia, Brazil, Chile and Peru, and global suites that add
  UBO and AML screening. Selection criteria: registry coverage per launch country, price per
  check, webhook + API quality, data-residency terms, and whether the result can be expressed as
  a signed attestation.
- **Layer 2 — bonded partners.** Local entities (chambers of commerce, accounting firms,
  established fintechs) that can vouch for businesses vendors cannot fully verify (informal
  registries, thin files). They post a **USDC bond**; if a business they vouched for commits
  fraud, the bond is slashed. This is the Maple-delegate and Credix-underwriter idea applied to
  identity rather than credit.
- **Layer 3 — underwriters.** Out of MVP scope; the Passport score and collateral ratio already
  play a partial role.

### Standards fit (Stellar)

- **SEP-12** defines the KYC API through which anchors collect customer data; wallets that
  implement it get a unified collection flow ([spec](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md)).
  The KYB submission (`KybSubmission`) is already shaped after it, so a vendor or anchor that
  speaks SEP-12 can be adapted with little friction.
- The on-chain Passport stores only a `data_hash` commitment; PII stays off-chain
  ([ADR-0004](../adr/0004-business-passport-storage-and-identity.md)).

## 4. Incentive design _(all values are hypotheses to validate in a pilot)_

| Lever | Proposal | Rationale |
| --- | --- | --- |
| Who pays | The business pays a small verification fee; the protocol may subsidise early cohorts | Aligns cost with the party that benefits; a subsidy lowers cold-start friction |
| Fee split | Verifier keeps most of the fee; protocol takes a small cut | The verifier does the work and carries the risk |
| Performance share | A slice of protocol revenue from a verified business flows back to its verifier while that business repays on time | Rewards _good_ verification, not volume |
| Bond | Layer-2 partners lock a minimum USDC bond sized to the loans they can vouch for | Skin in the game; caps exposure per partner |
| Slashing | Proven fraud → partial/full slash to the affected lenders; default rate above a threshold → reduced verification capacity | Punishes both fraud and sloppiness |
| Verifier reputation | Each verifier gets a public score = repayment performance of the businesses it vouched for | Same portable-reputation logic as the business Passport, applied one level up |
| Anti-collusion | Random assignment among eligible verifiers; cap the share of any single verifier per pool; disclose verifier identity on the Passport | Goldfinch-style randomisation reduces capture |

## 5. Token: not yet

Recommendation: **no native token in the MVP or SCF tranche 1–2.**

- The trust primitive is accountable bonded parties + real repayment data, both expressible in
  USDC. A token adds regulatory surface (securities analysis in several LatAm jurisdictions),
  liquidity and price-risk for verifiers, and distraction.
- Revisit a token only if (a) verifier staking must scale beyond what USDC bonds can, or
  (b) decentralised governance of the verifier set becomes a real requirement. Prefer
  non-transferable reputation (points / score) before any tradable asset.

## 6. Cold-start plan

1. **Now (MVP):** sandbox verifier + planned network shown in the UI (built).
2. **Pilot, one country:** integrate one vendor for that country's registry; hand-pick 3–5
   local partners; subsidise verification; measure time-to-verify, false-accept rate, cost per
   verified business.
3. **Bonded partners:** introduce the bond and performance share once there is repayment data
   to attribute.
4. **Second country + underwriters:** replicate; open the underwriter layer.

## 7. Risks

- **Collusion / verifier capture** — mitigated by randomisation, caps, public verifier scores.
- **Sybil businesses** — one tax ID per country is enforced (`@@unique([country, taxId])`); a
  real deployment needs registry lookups and UBO checks.
- **Data protection** — LatAm regimes differ (e.g. Brazil's LGPD, Peru's personal data law).
  Keep PII off-chain, minimise retention, define processor/controller roles with each vendor.
  _Confirm with counsel._
- **Vendor lock-in / outage** — keep the verifier interface vendor-neutral and support
  several vendors per country.

## 8. Funding rails (stablecoin in / out)

Users need USDC on Stellar to fund opportunities, post collateral and repay.

| Rail | How it works | Status in Fondealo |
| --- | --- | --- |
| Testnet faucet | Credits test USDC instantly | **Built** (mock ledger, see §9) |
| Cash ramp | [MoneyGram Ramps](https://developers.stellar.org/docs/tools/ramps/moneygram) lets users cash in / cash out USDC on Stellar at participating locations | Planned |
| SEP-24 anchors | Hosted deposit/withdrawal flows where the anchor collects KYC ([overview](https://developers.stellar.org/docs/learn/encyclopedia/anchors)); local-currency bank rails for LatAm need a per-country anchor search | Planned |

Design implication: KYC for funding (anchor-side) and KYB for borrowing (verifier-side) are
**separate** checks. The SEP-12 shape lets one customer record serve both where a provider
supports it.

## 9. What is mocked in the MVP today

| Area | Implementation | Real replacement |
| --- | --- | --- |
| KYB verifier | `lib/providers/kyb.ts` — `sandbox` decides deterministically (tax ID ending `0000` is rejected); other verifiers listed as _Planned_ | Vendor adapters behind the same catalog |
| Registration | 4-step wizard at `/business/verify`, creates `Business` + `KybSubmission`, issues a `PassportProjection` at score 500 | On-chain `business_passport.issue` |
| Balances | Append-only `LedgerEntry` table; wallets get **10,000 test USDC** once (`signup-grant`) | Real USDC balances on Stellar |
| Funding provider | `lib/providers/funding.ts` — Test Faucet live; cash ramp and SEP-24 anchor listed as _Planned_ | Provider adapters |
| Money flows | Fund debits the investor; full funding credits the business; repayment debits the business and pays funders pro rata; final repayment returns collateral | `loan_escrow` contract |

Every money action derives the caller from the verified session and runs in a serializable
transaction, so the balance check and the debit are atomic.

## Sources

- [Credix FAQ](https://docs.credix.finance/other-links-and-resources/faq) ·
  [Credix insured USDC pool](https://medium.com/credix/credix-launches-the-first-of-its-kind-fully-insured-usdc-receivables-pool-with-clave-solana-29b50768225a)
- [Goldfinch overview](https://docs.goldfinch.finance/goldfinch/goldfinch-v1/goldfinch-overview)
- [Maple (Consensys)](https://consensys.io/blog/maple-finance-creating-a-decentralized-credit-market)
- [Centrifuge (Gemini Cryptopedia)](https://www.gemini.com/cryptopedia/centrifuge-crypto-tinlake-tokenization-real-world-assets)
- [Stellar SEP-12](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md) ·
  [Stellar anchors](https://developers.stellar.org/docs/learn/encyclopedia/anchors) ·
  [MoneyGram Ramps on Stellar](https://developers.stellar.org/docs/tools/ramps/moneygram)
- [LatAm KYC/KYB provider overview](https://didit.me/blog/top-kyc-providers-latam/)
