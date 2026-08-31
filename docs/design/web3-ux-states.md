# Priority 2 — Web3 UX States

**Problem:** the app works, but it feels like a form with a wallet bolted on, not like
modern financial infrastructure. Every screen shows *data*; almost none show *state* —
where you are in the trust pipeline, what's verified, what's pending, what it unlocks.

**Fix:** five named, first-class UI states, each a small reusable component with explicit
`pending / active / error` variants, wired to real data (`getSession()`, the passport,
the escrow client). Build-ready specs below — same design language as Passport V2
(carbon glass, brand emerald `#10b981`, gold `#f59e0b`, Space Grotesk display).

The pipeline the user is walking:

```
Wallet Connected → Identity → KYB → Reputation → Funding
   (you exist)    (it's you)  (verified) (you're trusted) (capital moves)
```

A persistent **`<TrustRail>`** (see §6) makes that pipeline visible on every authed screen.

---

## 1. Wallet Connected State

**Replaces:** `wallet-status-bar.tsx` ("Logged in as G…") and the `privy-auth-button` pill.

**Job:** make "I hold a real Stellar account, self-custodied, funded" feel like a fact, not a debug string.

| Variant | Trigger | Shows |
| --- | --- | --- |
| `connecting` | `!ready \|\| creatingWallet` | shimmer pill, "Creating your Stellar account…" |
| `unfunded` | address exists, Friendbot not confirmed | amber dot, "Funding account…", XLM balance `—` |
| `connected` | address + XLM balance > 0 | green pulse dot, `GD4X…9K2Q`, copy button, `12.5 XLM`, network chip `Testnet` |
| `error` | `walletError` | red dot, "Wallet setup failed — refresh", retry affordance (F5 auto-retries) |

**Visual:** 40px-tall glass pill, `bg-white/[0.04]`, `border-white/10`, `backdrop-blur`.
Left: 8px status dot with a slow `pulse` when `connected`. Center: monospace truncated
address `slice(0,5)…slice(-4)` + a click-to-copy icon (toast "Copied"). Right: a divider
then live **XLM balance** (poll Horizon `/accounts/{id}` every 20 s) and a `Testnet` /
`Mainnet` chip in gold. Hover reveals a dropdown: full address, "View on Stellar Expert ↗",
"Fund via Friendbot", "Log out".

```tsx
<WalletChip
  address={session.stellarAddress}
  network="testnet"
  balance={{ xlm: 12.5, usdc: 0 }}      // from a useAccountBalances(address) hook
  status="connected"
/>
```

**Proposal:** add `useAccountBalances(address)` (Horizon poll, `packages/sdk`) — it also
feeds the Funding state and the dashboards, which currently show `—` for "Next payment"
and never show a wallet balance at all.

---

## 2. Identity State

**Job:** "this Stellar address *is* this business" — the link between the wallet and the
legal entity, before any verification. Today this is implicit and invisible.

| Variant | Trigger | Shows |
| --- | --- | --- |
| `anonymous` | `UserWallet.role` set, no `Business` row | "Claim your business identity" CTA → legal name + country form |
| `claimed` | `Business` row exists, `kybStatus = None` | business legal name, country flag, "Identity claimed · not yet verified", the address as the identity key |
| `linked` | KYB `Processing`/`Accepted` | adds a subtle "🔗 bound to GD4X…" line and a link to the Passport |

**Visual:** a compact card, left-aligned. Row 1: `Building` icon + **legal name** (display
font) + country flag emoji. Row 2: `font-mono text-xs text-white/50` — the Stellar address,
labeled "Identity key". Row 3: a thin state line with an icon (`○ unverified` grey /
`◐ in review` amber / `● verified` green). The address is presented as *the primary key of
the identity* — that's the Web3 point: the identity is portable and owned, not a row in
Fondealo's DB.

```tsx
<IdentityCard
  legalName="Bodega La Esquina S.A.C."
  country="PE"
  identityKey={session.stellarAddress}
  status="claimed"                       // anonymous | claimed | linked
/>
```

**Proposal:** the onboarding role step for "Business" should flow straight into the
identity claim (legal name + country) instead of dropping the user on an empty dashboard —
one screen, two fields, then the Passport is issued in `None` state.

---

## 3. KYB State

**Replaces:** the bare `passport.kybStatus` string badge.

**Job:** turn SEP-12 lifecycle (`None → Processing → Accepted / Rejected`) into a status
object with a timeline, an ETA, and a clear "what happens next".

| Variant | `kybStatus` | Shows |
| --- | --- | --- |
| `not_started` | `None` | "Verify your business" primary CTA, 3-bullet "what you'll need", "~10 min" |
| `submitted` | `Processing` | progress stepper (Submitted → Under review → Decision), "typically < 24 h", submitted timestamp, `dataHash` shown as the on-chain commitment |
| `verified` | `Accepted` | green seal, "KYB verified · Passport issued {date}", the `dataHash`, "Any Stellar lender can read this" |
| `rejected` | `Rejected` | reason, "Fix and resubmit" CTA, support link |

**Visual:** a horizontal 3-node stepper (done = filled emerald, current = ringed + pulse,
future = hollow). Under it, a single-line status + timestamp. When `verified`, collapse the
stepper into one green seal row and surface the **`dataHash`** prominently with a tooltip:
"A 32-byte commitment to your KYB bundle is stored on Soroban. The documents stay
off-chain; the proof is on-chain." That sentence is the product.

```tsx
<KybStatusPanel
  status={passport.kybStatus}
  submittedAt={kyb?.createdAt}
  decidedAt={kyb?.reviewedAt}
  dataHash={passport.dataHash}
/>
```

---

## 4. Reputation State

**Replaces / absorbs:** `score-gauge`, `score-breakdown`, the "Reputation journey" card.
This is the emotional core — see also `docs/strategy/differentiation-and-reputation-moat.md`.

| Variant | Trigger | Shows |
| --- | --- | --- |
| `new` | `loansTotal = 0` | score at floor (500 / band C), "Your reputation starts here", the exact `+points` a first on-time repayment adds |
| `building` | `loansRepaid > 0`, streak > 0 | animated score, streak flame, "next repayment: **+{previewOnTimeGain}**", band → collateral delta |
| `established` | band A/B | "Top-tier — {ratio}% collateral", "portable to any Stellar lender", a shareable proof card |
| `damaged` | a late/default event in history | score drop annotated on the timeline, "recovery path: N on-time repayments to return to band {X}" |

**Visual:** the Passport V2 score ring is the hero. Beside it:
- a **delta ticker** — "Next on-time repayment: `+37` → band B" — recomputed live from
  `previewOnTimeGain(score, streak)` (already deterministic in `@fondealo/types`).
- a **reputation timeline** — a vertical rail of real events (`ScoreEvent` rows once
  indexed): `KYB accepted`, `Loan #1 repaid on time +40`, `Streak bonus +15`, each with
  `scoreBefore → scoreAfter` and a tx hash link. This is the "difficult to replicate"
  asset made visible.
- a **"what this is worth" line**: current band's collateral ratio vs. the next band's,
  in USDC, for the user's typical loan size.

```tsx
<ReputationPanel
  passport={passport}
  events={scoreEvents}                    // ScoreEvent[] — timeline
  typicalLoanUsdc={5000}                  // for the "worth" calc
/>
```

---

## 5. Funding State

**Replaces:** the static numbers on `fund-panel.tsx` / `repay-form.tsx` and the loan detail page.

**Job:** show capital *in motion* — escrow lifecycle, on-chain, with tx hashes — so an
investor feels the rails, not a "submit" button.

| Variant | Escrow status | Shows (business ↔ investor views) |
| --- | --- | --- |
| `open` | `Open` | funding bar `{funded}/{amount}` USDC, "N investors", "you'd fund X → own Y%", APR from band |
| `signing` | tx submitted, unconfirmed | "Signing with your Stellar key…", spinner, the XDR being signed |
| `funded` | `Funded` | "Fully funded {date}", collateral locked amount, first payment due date, tx hash |
| `active` | `Active` | repayment progress ring, next installment amount + date, "{repaidSoFar}/{totalDue}" |
| `settled` | `Repaid` | "Repaid in full · collateral returned · score +{n}", all tx hashes, "reputation updated" |
| `defaulted` | `Defaulted` | collateral distribution to investors, loss vs. protected amount |

**Visual:** a state machine strip at the top of every loan/opportunity card (6 nodes,
current one lit). Every money movement shows the **amount + asset + a truncated tx hash
linking to Stellar Expert**. During `signing`, show that a real transaction is being built
and signed by the user's own key ("non-custodial · you sign every move"). On `settled`,
fire a one-shot confetti + the score delta animating on the Passport.

```tsx
<FundingLifecycle
  opportunity={opportunity}
  view={session.role === 'Business' ? 'borrower' : 'investor'}
  txHashes={{ fundedAt: '…', repayments: ['…'] }}
/>
```

---

## 6. `<TrustRail>` — the connective tissue

A slim, always-present rail (top of the authed layout, under the navbar) showing the five
states as linked nodes with the user's real progress:

```
● Wallet ─── ● Identity ─── ◐ KYB ─── ○ Reputation ─── ○ Funding
 connected     claimed      in review    band C          no loans yet
```

- Each node: icon, one-word status, colour (grey/amber/green/red).
- Click a node → scroll/route to that panel.
- Collapses to a 5-dot progress pip on mobile.
- Derived entirely from `getSession()` + `getBorrowerPassport()` — no new data.

This single component is what makes the app *read* as infrastructure: the user always sees
the whole trust pipeline and where they are in it.

---

## Build order (smallest → biggest demo impact)

1. `<WalletChip>` + `useAccountBalances` — replaces the debug-string status bar. (~half day)
2. `<TrustRail>` — highest "feels like infra" payoff for the effort. (~1 day)
3. `<KybStatusPanel>` stepper — makes the on-chain `dataHash` legible. (~half day)
4. `<ReputationPanel>` timeline — the moat, made visible. (~1–2 days, needs `ScoreEvent` indexing)
5. `<FundingLifecycle>` strip — the "capital in motion" wow for investors. (~1–2 days)

All reuse the Passport V2 CSS tokens and the existing `@fondealo/ui` primitives. No new deps.
