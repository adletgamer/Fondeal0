# Priority 5 — Why Fondealo beats a Web2 solution, and where the moat is

No marketing. Concrete mechanics, and honest about where Web2 is fine.

---

## 0. Thesis

Fondealo's advantage is **not** "blockchain." It is one specific property that Web2 credit
infrastructure structurally cannot have: **a business's credit reputation is an asset the
business owns and carries, readable and enforceable by any lender, without a bureau, a data
-sharing agreement, or the incumbent's permission.**

Everything below is a consequence of that.

---

## 1. vs. Banks

| Dimension | Bank | Fondealo | Why it's structural, not just "better UX" |
| --- | --- | --- | --- |
| **Whose record is it** | The bank's. Your history at BBVA is invisible to Santander. Closing the account or switching banks resets you to zero. | The business's. The Passport + score live in a Soroban contract keyed to the business's own Stellar address. | A bank's core deposit/loan ledger is a competitive asset; sharing it helps a competitor. There is no incentive gradient that ends with portable bank reputation. Fondealo's ledger is the *product*, so making it portable is aligned, not self-defeating. |
| **Collateral** | Fixed policy, often 100–150% + a personal guarantee + real-estate lien, set by risk committee, rarely revisited. | Deterministic function of the on-chain score: `A 20% / B 35% / C 50% / D 75% / E 100%` (`COLLATERAL_CONFIG_V1`), recomputed every loan. | A bank re-underwrites from scratch each time because it has no cheap, trusted, continuously-updated signal of *this* borrower. Fondealo does: the score updated on every prior repayment. |
| **Time to decision** | Days–weeks; manual document review; relationship-manager dependent. | The read is a contract call. KYB is once (SEP-12), then reused forever. | Banks can't reuse KYC across institutions (no shared, verifiable identity primitive). Fondealo issues one Passport with an on-chain `dataHash` commitment; every later lender reads it. |
| **Settlement** | Correspondent banking, 1–3 days cross-border, FX spread, cutoff times. | USDC on Stellar: seconds, sub-cent fee, 24/7, no correspondent. | This is the one place the rails themselves matter. For a Peruvian bodega funded by capital outside Peru, it's decisive. |
| **Who they'll serve** | Businesses with 2+ years of audited financials and existing banking relationships. Thin-file and informal SMEs are declined by policy. | KYB-gated but not financials-gated. Reputation is *built from behavior*, starting at band C, not from a balance sheet. | Banks underwrite off documents the informal-economy SME doesn't have. Fondealo underwrites off repayment behavior it can observe directly. |

**What a bank does better:** deposit insurance, regulatory recourse, large-ticket
term loans, treasury services, physical presence. Fondealo is not competing for those.

---

## 2. vs. Fintech lending (Konfío, Clara, r2, Addi, a16z-style balance-sheet lenders)

These already fixed the *UX* problem — fast, digital, thin-file-friendly. Fondealo's
difference vs. them is narrower and specific:

| | Fintech lender | Fondealo |
| --- | --- | --- |
| **Reputation portability** | Still a walled garden. Your Konfío repayment history is a Konfío asset. Move to Clara → start over. Same lock-in as a bank, nicer app. | The score is on-chain and lender-agnostic. A business that outgrows Fondealo's investor pool takes its band A reputation to any Stellar lender that reads the Passport. |
| **Capital source** | The fintech's own balance sheet or a warehouse line. Growth is gated by how much debt capital they can raise; risk concentrates on them. | A marketplace: many investors fund each loan in USDC. Fondealo holds no credit risk on its balance sheet; it operates the rails and the scoring. |
| **Underwriting transparency** | Proprietary ML model. The borrower cannot see why they were priced at 34% or what would lower it. | `previewOnTimeGain(score, streak)` and `COLLATERAL_CONFIG_V1` are public and deterministic. The borrower sees the exact `+37 points → band B → 35% collateral` before they act. |
| **Anti-gaming** | Handled internally, opaquely. | In the contract and the spec (R-01): self-funded round-trips are **score-neutral** (`external == false ⇒ score unchanged`). Reputation requires *someone else's* capital to have been at risk. Auditable by anyone. |
| **Composability** | None. A fintech loan is an endpoint. | The Passport is a primitive other Stellar protocols consume (Blend, an agent via MCP — see RFC 0001). Fondealo can be the credit-scoring layer *for* other lenders, not only a lender. |

**What fintech lenders do better today:** underwriting sophistication (real ML on bank
-transaction data, tax records, e-invoicing feeds), collections operations, licensed
lending in-country, scale. Fondealo's score is deliberately simple; it's a *behavioral*
score, not a *predictive* one, and it only gets good with volume.

---

## 3. vs. Traditional P2P marketplaces (Afluenta, LendingClub-model, Prosper)

The marketplace model itself is Web2-native and mostly fine. Fondealo's deltas:

| | Traditional marketplace | Fondealo |
| --- | --- | --- |
| **Borrower identity** | Marketplace-internal account. Grade is assigned by the platform's model and disappears if the platform does. | Portable Passport; survives the platform. |
| **Investor settlement & custody** | ACH / bank transfer, T+N, platform holds funds in an FBO account (platform failure = investor funds at risk — see the LendingClub/Prosper wind-down concerns). | USDC in a Soroban escrow contract. Funds move borrower↔investor; the platform is never a custodian. Collateral is locked on-chain, first-loss, transparent. |
| **Loan servicing transparency** | Statements from the platform; investor trusts the platform's accounting. | Every disbursement, repayment, and collateral movement is a Stellar tx the investor can verify independently. |
| **Cross-border** | Usually single-country (regulatory + banking rails). | USDC + Stellar = an investor in one country can fund an SME in another without correspondent banking. |
| **Default handling** | Platform-run collections, opaque recovery waterfall. | Escrow contract distributes locked collateral to investors first (covers the first `maxProtectedPct` of loss) — mechanical, visible. |

**What traditional marketplaces do better:** regulatory clarity, secondary markets for
loan parts, institutional investor tooling, decades of loss-curve data.

---

## 4. Where Web2 is genuinely fine (be honest)

- KYB itself is off-chain and always will be (PII can't go on-chain). Only the `dataHash`
  commitment is on-chain.
- The opportunity metadata (title, description, business story) is an off-chain DB row.
- Fraud/collusion monitoring (investor and borrower are distinct addresses but coordinated)
  is an off-chain graph-analysis problem; the chain doesn't solve it.
- A single-country lender with a warehouse line and a good ML model will out-underwrite
  Fondealo on a thick-file borrower for years.

Fondealo wins specifically for: **thin-file / informal LatAm SMEs, cross-border capital,
and any borrower who will take out more than one loan over time** (because that's when
portability + compounding reputation pays off).

---

## 5. The Reputation Layer — why Passport + Score + History is hard to replicate

The moat is not any one of the three. It's the loop between them plus three properties
that compound over time.

### 5.1 The three pieces

| Piece | What it is | Contract |
| --- | --- | --- |
| **Business Passport** | KYB-gated, reusable identity: status, score, band, `dataHash`, issued/updated. Store of record. | `business_passport` |
| **Credit Score** | Deterministic `0–1000`, `external`-only rewards, diminishing returns (`gain ∝ headroom`), asymmetric penalties (default 150 ≫ late 30 ≫ self-funded 0). | `credit_score` |
| **Repayment History** | The append-only sequence of `ScoreEvent`s (`scoreBefore → scoreAfter`, reason, tx hash) that produced the current score. | escrow events + index |

### 5.2 Why it's a moat, concretely

1. **It's a data asset that only accrues with real capital at risk.**
   A competitor can copy the contracts in an afternoon (they're open). What they can't copy
   is *N businesses × M repayments of history*, each of which required a real investor's
   USDC to have been locked and returned. The `external`-only rule (R-01) means you cannot
   bootstrap a fake reputation graph cheaply — every point of score corresponds to
   third-party capital that was actually exposed. The cost to fake Fondealo's dataset ≈ the
   cost of actually running Fondealo.

2. **Portability makes switching costs asymmetric in Fondealo's favor.**
   Normally portability *reduces* lock-in. Here it inverts: a business builds a band-A
   Passport on Fondealo, and that Passport is readable by *other* Stellar lenders. So the
   business has no reason to rebuild reputation elsewhere — Fondealo's record already works
   everywhere. Fondealo becomes the *issuer* of the reputation the rest of the ecosystem
   consumes. A competitor starting later isn't just behind on data; they're offering a
   worse version of a credential the business already holds.

3. **Determinism + transparency is a trust primitive a black-box model can't match.**
   Because the formula is public and on-chain, a business (or an agent, via MCP) can prove
   "if I make this payment, my collateral on a 5,000 USDC loan drops from 2,500 to 1,750
   USDC." No fintech can offer that because their edge *is* the opacity. Fondealo's edge is
   the opposite, and it's the one lenders building on Stellar will want to integrate,
   because they can verify it.

4. **Network effects on both sides, keyed to the same object.**
   More businesses with Passports → more/deeper opportunities → more investors → tighter
   pricing → more attractive to businesses. And every lender that reads the Passport (Blend,
   an MCP agent, another marketplace) increases the value of *having* one, which pulls in
   more businesses. The Passport is the single object all of that compounds around.

### 5.3 How to widen it (roadmap)

- **Prove `external` on-chain (score-spec R-01, open).** Derive "third-party funded" from
  escrow facts (funder ≠ business), not a trusted boolean. This is what makes the dataset
  *provably* un-fakeable rather than just expensive to fake. Highest-leverage item.
- **Publish the read side as an MCP server (RFC 0001).** Make Fondealo the default "credit
  oracle" for Stellar lending agents before anyone else claims that slot.
- **Ship the Reputation timeline UI (`docs/design/web3-ux-states.md` §4).** The moat is
  invisible today. A business seeing `Loan #3 repaid on time +38 · streak bonus +15` with
  tx links is what makes the reputation feel *owned*.
- **Cross-protocol reads.** One integration where Blend (or any Stellar lender) prices a
  loan off the Fondealo Passport — that's the composability claim made real, and it's the
  reference every future integrator copies.
- **Reputation-backed underwriting for larger tickets** once the loss curve exists: band A
  + N-loan history → uncollateralized or lightly-collateralized credit lines. That's the
  end state Web2 can't reach without owning the borrower.
