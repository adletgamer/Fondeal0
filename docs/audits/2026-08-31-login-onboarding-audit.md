# Priority 0 — Login & Onboarding Audit

**Date:** 2026-08-31
**Scope:** `login → OTP → wallet creation → session creation → role selection → persist role → redirect`
**Branch:** `feat/mvp-hardening-passport-v2`
**Reviewers' lenses:** Principal Frontend Engineer · Security Engineer · Demo Day Reviewer

---

## 1. Flow as built (traced through the code)

| Step | Owner | File |
| --- | --- | --- |
| 1. Login / OTP | Privy modal (`email`, `wallet`) | `components/privy-providers.tsx` |
| 2. Stellar wallet creation | `useCreateWallet({ chainType: 'stellar' })` + `refreshUser()` | `hooks/use-stellar-wallet.ts` |
| 3. Testnet funding | Friendbot (fire-and-forget) | `hooks/use-stellar-wallet.ts` |
| 4. Session cookie | `<SessionSync>` reads `useIdentityToken()` → `syncSession()` sets `fondealo_session` (httpOnly) | `components/session-sync.tsx`, `lib/actions/session.ts` |
| 5. Server identity | `getSession()` verifies the Privy JWT locally, upserts `UserWallet` | `lib/auth/session.ts` |
| 6. Role selection | `chooseRole()` — conditional (`role: null`) write, then `redirect()` | `lib/actions/onboarding.ts` |
| 7. Route gating | Edge middleware (cookie presence) + section layouts (`getSession()` role check) | `middleware.ts`, `app/business/layout.tsx`, `app/invest/layout.tsx` |

> Note on route names: the product spec refers to `/dashboard/business` and `/dashboard/investor`. Those routes **do not exist** — they were deleted in `0e01e74` along with a second IDOR. The live routes are `/business` and `/invest`. `/investor` is a 404. The audit is against the routes that exist.

---

## 2. E2E verification

Full runtime E2E (real Privy email OTP + live Neon) can't be automated from CI, so each
case below is a **code-path trace** plus the build/typecheck/lint gate (all green) and a
local render check of every non-authed surface.

### Case 1 — New user → Business  → expects Business dashboard

1. `/onboarding?intent=business` → `getSession()` returns `null` (no cookie) → `<OnboardingFlow>` renders.
2. Privy login + OTP → `authenticated` flips true.
3. `useStellarWallet`: waits for `user` to hydrate, calls `createWallet({chainType:'stellar'})`, then `refreshUser()`.
4. `<SessionSync>` sees the refreshed `identityToken` → `syncSession()` → `fondealo_session` set.
5. Role screen shows "I am a Business" first (intent-sorted). Click → `chooseRole('Business')`.
6. `getSession()` inside the action: verifies JWT, `upsert` creates `UserWallet { role: null }`.
7. `updateMany({ where: { privyUserId, role: null }, data: { role: 'Business' } })` → count 1.
8. `redirect('/business')`. Layout `getSession().role === 'Business'` → renders. **PASS.**

### Case 2 — New user → Investor → expects Investor dashboard

Identical to Case 1 with `intent=invest` and `chooseRole('Investor')` → `redirect('/invest')`.
`/business/layout` would bounce an Investor to `/invest` if they navigated there. **PASS.**

### Case 3 — Existing user → expects **no** role re-selection

1. Login → `useStellarWallet` finds the Stellar account already on `user.linkedAccounts`, **skips** `createWallet`.
2. `<SessionSync>` → cookie set.
3. Any visit to `/onboarding`: `getSession().role` is `'Business'`/`'Investor'` → server-side `redirect()` **before** `<OnboardingFlow>` mounts — no client flash.
4. `chooseRole()` is also idempotent: `if (session.role) redirect(SECTION_FOR_ROLE[session.role])`. **PASS.**

### Case 4 — No session → expects **no** access to protected routes

| Target | Result |
| --- | --- |
| `/business`, `/business/*` | Edge middleware: no `fondealo_session` cookie → `307 → /onboarding` before render |
| `/invest`, `/invest/*` | same |
| `/business/loans/[id]` | middleware + **new**: page calls `getSession()`, `redirect('/onboarding')` if none, and `notFound()` if the loan isn't the caller's |
| `/dashboard/business`, `/investor` | 404 (routes don't exist) |
| Expired/garbage cookie | passes middleware (presence only) → layout `getSession()` returns `null` → page-level `getSession()` guard `redirect('/onboarding')` |

**PASS**, with the note that the *layout* itself only redirects on role **mismatch**, not on a
missing session — the per-page `getSession()` guard is what stops a null session. Every
protected page now has that guard (verified: `business/page`, `business/new`,
`business/passport`, `business/loans/[id]` *(added)*, `invest/page`, `invest/positions`).
`invest/market` and `invest/opportunity/[id]` intentionally render public marketplace data.

---

## 3. Findings & fixes applied in this branch

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| F1 | **High** | **IDOR on `/business/loans/[id]`** — the `/business` layout only proves you're *a* business, not that the loan is yours. Any logged-in business could read another business's principal, APR, and full repayment schedule by walking loan ids. Same bug class the `?address=` removal was meant to close. | `app/business/loans/[id]/page.tsx` now calls `getSession()` and returns `notFound()` when `opportunity.business !== session.stellarAddress`. |
| F2 | **Medium** | **Wallet address leaked into the URL.** `AuthGate` pushed `?address=G…` into the query string / history / referrer on every protected page, purely vestigial since server pages switched to `getSession()`. | Removed the `router.replace(?address=)` effect and the `useSearchParams`/`usePathname`/`useRouter` imports from `auth-gate.tsx`. |
| F3 | **Medium** | **Role-selection race (TOCTOU).** `chooseRole` did `if (session.role) … else update({ role })` — two tabs / a double-click could land two different roles; "write once" was app-level, not enforced. | Conditional `updateMany({ where: { role: null }, data: { role } })`; `count === 0` ⇒ someone won the race ⇒ redirect to the persisted role. Now atomic at the DB. |
| F4 | **Medium** | **First-login `UserWallet` create race.** `findUnique` → `create` could have two concurrent requests both hit `create` → `P2002` → caught → user bounced to `/onboarding` with role `null`. | `resolveWallet()` uses `upsert`; `getSession()` catches `P2002` and re-reads once. |
| F5 | **Medium** | **Wallet-creation dead end.** A single `createWallet` failure set `attempted.current = true` forever — the user sat on "Setting up your Stellar wallet…" with no retry until a full reload. | `use-stellar-wallet.ts`: bounded auto-retry (`MAX_CREATE_ATTEMPTS = 3`, 1.5 s backoff) via a `retryTick`; error copy says "Retrying…" then "Please refresh". |
| F6 | **Medium** | **`createWallet` fired before `user` hydrated.** `authenticated` flips true a beat before `user.linkedAccounts` populates; acting on that gap could call `createWallet` for someone who *already* has a Stellar wallet. | Guard is now `if (!ready || !authenticated || !user || stellarAddress) return`. |
| F7 | **Low/Med** | **Session-sync had no failure handling.** `syncSession()` was fire-and-forget; a dropped request left the cookie stale until Privy's next (~hourly) token refresh. | `session-sync.tsx`: awaits the result, retries with exponential backoff (max 4), only records `lastSynced` on success. |
| F8 | **Low** | **DB write on every protected navigation.** `getSession()` wrote `lastLoginAt` on every call (deduped per-request by `cache()`, but still one write per page view). | Throttled to once per hour (`LAST_LOGIN_THROTTLE_MS`). |
| F9 | **Cleanup** | `components/address-lookup-banner.tsx` — dead since the IDOR fix, still shipped a "paste any address" form. | Deleted. |

---

## 4. Not changed (accepted for the MVP, tracked here)

- **Middleware is presence-only.** It cannot verify the JWT (Edge runtime, no Prisma / `@privy-io/server-auth`). A forged-but-present cookie still reaches the layout, which fails it. Acceptable: no data is served before the Node-side check. A future hardening is an Edge-compatible JWT signature check (Privy's JWKS) in middleware.
- **DB-outage UX.** If Prisma is unreachable, `getSession()` returns `role: null` (fail-closed) and existing users are bounced to `/onboarding`; they can't cross-access anything, but the bounce is jarring. Fine for a Testnet demo.
- **Friendbot funding is best-effort.** If it's down, the wallet has no XLM for fees; not login-blocking.
- **No explicit session-expiry surface.** After the Privy token expires (~1 h) an in-tab user who clicks a protected link is briefly redirected to `/onboarding` and recovers once `<SessionSync>` pushes the refreshed token. See the session-architecture review for the full analysis.
