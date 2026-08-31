# RFC 0001 — Stellar MCP Integration

- **Status:** Draft
- **Date:** 2026-08-31
- **Author:** Stellar Ecosystem Architect lens
- **Objective:** let Fondealo use — and expose — Stellar ecosystem capabilities through the
  Model Context Protocol (MCP), in a way that is **demonstrable on Demo Day** and not just
  a slide.

---

## 1. Background

MCP is a standard for giving LLM agents structured, typed access to tools and data. The
Stellar ecosystem already has a small MCP surface:

| Server | What it exposes |
| --- | --- |
| `syronlabs/stellar-mcp`, `JoseCToscano/stellar-mcp` | Horizon queries, account ops, Soroban contract invoke/read, tx build+sign |
| "Soroban → MCP" CLI extension | turns *any* Soroban contract into an MCP server from its spec |
| "Stellar Raven" | aggregated, verified Stellar docs — anti-hallucination context for agents |

Fondealo's contracts (`business_passport`, `credit_score`, `loan_escrow`) are already
spec'd Soroban contracts with clean read methods. That makes them a natural MCP surface.

## 2. Two directions

### 2a. Fondealo **as an MCP server** — "the credit layer, queryable by any agent"

Expose the *read* side of the reputation layer as MCP tools. Any Stellar agent (a lending
bot, a treasury agent, a wallet copilot) can ask Fondealo about a business before it lends.

Tools:

| Tool | Backed by | Returns |
| --- | --- | --- |
| `fondealo_get_passport(address)` | `business_passport.get` | KYB status, score, band, `dataHash`, issued/updated |
| `fondealo_get_score(address)` | `credit_score.get` + `preview` | current score, band, `+points` for the next on-time repayment |
| `fondealo_get_repayment_history(address)` | `ScoreEvent` index + escrow | ordered events: `scoreBefore → scoreAfter`, reason, tx hash |
| `fondealo_list_opportunities(filter?)` | `loan_escrow.list_opportunities` | open funding opportunities, APR, band, collateral ratio |
| `fondealo_assess(address, amount)` | pure fn over the above | collateral required, suggested APR, protected %, "fundable? why" |

All **read-only** — no signing, no PII. The `dataHash` is the trust anchor: an agent can
verify the KYB commitment on-chain independently.

### 2b. Fondealo **as an MCP client** — richer answers during the demo

Fondealo's own screens call out to ecosystem MCP servers for context it doesn't own:

| Use | MCP source | Where it shows |
| --- | --- | --- |
| Live XLM/USDC balances, account age, trustlines | `stellar-mcp` Horizon tools | Wallet Connected state (§1 of web3-ux-states) |
| "Explain this transaction" on any tx hash | `stellar-mcp` | Funding Lifecycle tx links |
| Verify a `dataHash` is really on Soroban | `stellar-mcp` contract-read | KYB State panel |
| Ground the in-app assistant in real Stellar docs | Stellar Raven | a `?` helper on each state |

## 3. Benefits

- **Composability, demonstrated.** Fondealo's pitch is "we own the credit layer other
  Stellar protocols consume." An MCP server is that claim, executable live: open Claude,
  point it at `fondealo-mcp`, ask "should I lend 5,000 USDC to `GD4X…`?", watch it call
  `fondealo_assess` and answer with the real on-chain score.
- **No new trust assumptions.** Read-only, on-chain-backed, PII-free.
- **Ecosystem alignment.** Uses the same MCP surface the Stellar Foundation is promoting;
  positions Fondealo as infrastructure, not an app.
- **Cheap to build.** The contracts already have the read methods; `packages/sdk` already
  wraps them (`PassportClient`, `EscrowClient`).

## 4. Architecture

```
                        ┌───────────────────────────┐
   Claude / any agent ──┤  @fondealo/mcp  (new pkg) │
                        │  - stdio + HTTP transport │
                        │  - 5 read tools           │
                        └────────────┬──────────────┘
                                     │ reuses
                     ┌───────────────┴───────────────┐
                     │  @fondealo/sdk                 │
                     │  PassportClient / EscrowClient │
                     └───────────────┬───────────────┘
                                     │ Soroban RPC (read)
                     ┌───────────────┴───────────────┐
                     │  Testnet: business_passport,  │
                     │  credit_score, loan_escrow    │
                     └───────────────────────────────┘
```

- **New package:** `packages/mcp` — thin. `@modelcontextprotocol/sdk` + `@fondealo/sdk`.
- **No database dependency** — reads chain directly, so it runs anywhere (including a
  judge's laptop) with just the Testnet RPC URL + contract ids from `.env`.
- **Transport:** `stdio` for local agent use (Claude Desktop / Code); optional HTTP wrapper
  behind the existing Next app (`/api/mcp`) for a hosted demo.
- **Auth:** none for reads. If write tools are ever added, they return an unsigned XDR for
  the user's own wallet to sign — never a key on the server.

## 5. Roadmap

| Phase | Scope | Effort | Demo-ready? |
| --- | --- | --- | --- |
| **P0 — spike** | `packages/mcp` with `fondealo_get_passport` + `fondealo_assess` over Testnet, stdio only. A README showing `claude mcp add`. | ~1 day | ✅ enough for a live "ask the agent" moment |
| **P1 — full read surface** | all 5 tools, `ScoreEvent` history, error handling, a `fondealo://` resource for the collateral config | ~2 days | ✅ complete story |
| **P2 — hosted** | `/api/mcp` HTTP transport in the Next app, so the demo needs no local setup | ~1 day | nicer for remote judging |
| **P3 — client side** | wire `stellar-mcp` / Raven into the Wallet + KYB + Funding states for live balances and tx explanations | ~2 days | polish |
| **P4 — post-hackathon** | publish `@fondealo/mcp` to npm + list on mcpservers.org; propose it as the reference "credit oracle" MCP for Stellar lending agents | — | ecosystem play |

## 6. Demo Day script (P0/P1)

1. Terminal: `claude mcp add fondealo -- npx @fondealo/mcp` (or point at the repo).
2. In Claude: *"There's a business at `GD4X…9K2Q` asking for 5,000 USDC. Should an investor fund it?"*
3. Claude calls `fondealo_get_passport` + `fondealo_assess`, replies:
   *"KYB verified (hash `0x…` on Soroban), score 640 / band C, 3/3 repaid, streak 3.
   At band C this needs 120% collateral and prices at ~20% APR. The collateral covers
   the first 30% of any loss. Fundable."*
4. Point at the same numbers on the Fondealo dashboard — same source of truth.

That's "capabilities of the Stellar ecosystem, used demonstrably" in 90 seconds.

## 7. Open questions

- Rate-limiting / caching the Soroban RPC reads if the MCP server is hosted.
- Whether to expose `fondealo_assess` (opinionated) or keep the MCP purely factual and let
  the agent reason. (Lean: expose it — it encodes the deterministic collateral config, which
  is the point.)
- Versioning the tool schema alongside `COLLATERAL_CONFIG_V1`.

Sources: [syronlabs/stellar-mcp](https://github.com/syronlabs/stellar-mcp/) · [JoseCToscano/stellar-mcp](https://github.com/JoseCToscano/stellar-mcp) · [Soroban → MCP (DoraHacks)](https://dorahacks.io/buidl/25271) · [Stellar Developers Meeting 2026-07-16 (Raven)](https://lumenloop.com/media/stellar-developers-meeting-07-16-2026-2) · [Model Context Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol)
