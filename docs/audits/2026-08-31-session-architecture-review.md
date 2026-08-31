# Session Architecture Review

**Date:** 2026-08-31
**Component:** custody & auth model (ADR 0006) as implemented after `b5280eb`
**Related:** [`2026-08-31-login-onboarding-audit.md`](./2026-08-31-login-onboarding-audit.md)

---

## 1. How sessions actually work here

```
Privy (client)                         Fondealo server
─────────────                          ───────────────
usePrivy(): authenticated, user
useIdentityToken(): identityToken  ──►  syncSession(idToken)         [Server Action]
      │  (login, linked-account change,   │  PrivyClient.getUser({idToken})  — verifies JWT sig locally
      │   ~hourly refresh)                 │  cookies().set('fondealo_session', idToken, httpOnly, 7d)
      ▼                                    ▼
 <SessionSync> effect                   getSession()  [React cache() per request]
                                          │  read fondealo_session
                                          │  PrivyClient.getUser({idToken})  — verify again
                                          │  upsert UserWallet(privyUserId) → { role, stellarAddress }
                                          ▼
                                     Session { privyUserId, stellarAddress, role }
```

Key properties:

- **The cookie is ours, not Privy's.** `fondealo_session` holds the Privy *identity token* (a JWT). Privy's own `privy-id-token` cookie was abandoned in `b5280eb` because it depended on dashboard-side domain verification that never materialised on `fondealo.vercel.app`.
- **The token is verified on every read.** `getUser({ idToken })` checks the signature offline — no network round-trip, no shared secret in the Edge bundle. The 7-day cookie `maxAge` is just how long a *stale* cookie lingers; the JWT inside expires far sooner (~1 h, Privy default) and a stale one simply fails verification → `getSession()` returns `null`.
- **Role lives only in Postgres**, keyed by the verified `privyUserId`, never trusted from the client.

---

## 2. Risks & edge cases

### 2.1 Session expiration (the main UX risk)

The identity token expires ~1 h after issue. Privy refreshes it in the background **while a tab is open** and `useIdentityToken()` emits the new value, which `<SessionSync>` pushes to the server.

**Gap:** a user who leaves a tab open past expiry and then clicks a protected link *before* the refresh + re-sync round-trip completes gets:

`click → middleware OK (cookie present) → layout getSession() = null → page redirect('/onboarding') → SessionSync pushes fresh token → user manually navigates back`

- No data is exposed and nothing breaks, but it reads as "it logged me out."
- **Mitigated** by F7 (retry on sync failure) and by Privy's proactive refresh, but not eliminated.
- **Real fix (post-MVP):** on `getSession() === null` while Privy is still `authenticated` client-side, have `<AuthGate>` / a small boundary trigger `syncSession()` and re-fetch instead of showing the login screen. I.e. distinguish "genuinely logged out" from "cookie behind live state."

### 2.2 Race conditions

| Race | Status |
| --- | --- |
| Two first-login requests both `create` the `UserWallet` row | **Fixed** — `upsert` + `P2002` re-read (F4) |
| Two tabs / double-click choose different roles | **Fixed** — conditional `updateMany(role: null)` (F3) |
| `createWallet` fired during the `authenticated`-true / `user`-null gap | **Fixed** — `!user` guard (F6) |
| `<SessionSync>` sync in-flight while the effect re-runs with the same token | Benign — old push is cancelled, `syncSession` is idempotent server-side |
| `getSession()` `cache()` dedup vs. layout + page both calling it | Fine by design — one verify + one DB touch per request |

### 2.3 Synchronisation problems

- **Token lag after wallet creation.** Linking the Stellar wallet reissues the token; `refreshUser()` (client) + `<SessionSync>` push close the gap. `chooseRole()` still guards with a friendly "wallet still finishing setup" message if it somehow reads a token with no Stellar address. Chain of defence is intact.
- **`lastLoginAt` write amplification.** Was one write per navigation; now throttled to 1/hour (F8).
- **`stellarAddress` uniqueness.** `UserWallet.stellarAddress` is `@unique`. If Privy ever re-issues a *different* embedded address for the same user, `resolveWallet` will try to update to it and could `P2002` against another row. Not observed; low risk on Testnet. Worth a `@@unique([privyUserId])`-primary model rethink later.

### 2.4 Multi-tab behaviour

- **Logout propagates.** Privy broadcasts auth state across tabs; each tab's `<SessionSync>` sees `authenticated → false` and calls `clearSession()`. First call clears the cookie, rest are no-ops.
- **Login propagates** the same way — a second tab picks up the identity token and syncs.
- **Role is shared** (one cookie, one DB row). A second tab that lands on the role screen and submits hits the `session.role` guard → redirected to the already-chosen section. Post-F3 this is race-free.
- **Stale tab after logout-elsewhere.** A tab that was already inside `/business` when another tab logged out keeps its rendered server HTML until the next navigation; the next request has no cookie → middleware redirect. No data leak, just a delayed bounce.

### 2.5 Mobile behaviour

- **Email OTP path** has no OAuth redirect, so `sameSite: 'lax'` on `fondealo_session` is fine. The `wallet` login method can redirect; `lax` still allows the top-level GET back.
- **`secure` is off in dev** (`NODE_ENV !== 'production'`) so localhost over plain HTTP works; on Vercel it's `secure` + httpOnly.
- **iOS Safari ITP / storage partitioning:** `fondealo_session` is first-party httpOnly — persists. Privy's own tokens are first-party localStorage — persist. No third-party cookie dependency in the session path.
- **Backgrounding mid-wallet-creation** (common on mobile) could reject/hang `createWallet`; F5's bounded retry now recovers instead of stranding the "Setting up…" spinner.
- **`prefers-reduced-motion`** is honoured by the new Passport component; no motion-induced jank on low-end devices.
- Not yet tested on a real device — flagged for the demo dry-run.

### 2.6 Security posture

- ✅ No client-supplied identity anywhere in the server path (IDOR class closed; F1 was the last instance).
- ✅ JWT verified offline on every read; no secret in the Edge bundle.
- ✅ Role escalation blocked at three layers: `chooseRole` write-once (now atomic), section layouts, per-page `getSession()` guards.
- ✅ `httpOnly` cookie — not readable from JS, so XSS can't exfiltrate the session token directly.
- ⚠️ Middleware is presence-only (see audit §4).
- ⚠️ No CSRF token on the Server Actions. Next.js Server Actions are POST-only with an `Origin` check and a per-action id, which covers the common cases; `chooseRole` is also idempotent and write-once. Acceptable for the MVP.

---

## 3. Recommendations, prioritised

| Priority | Item |
| --- | --- |
| P1 (post-demo) | Distinguish "logged out" from "cookie behind live state" — auto re-sync on `getSession() === null` while Privy is `authenticated`. Removes the only real "it logged me out" moment. |
| P2 | Edge-side JWT signature check in `middleware.ts` using Privy's JWKS (keeps forged cookies from ever reaching a render). |
| P2 | Real-device pass: iOS Safari + Android Chrome, email OTP, wallet-creation, backgrounding. |
| P3 | Revisit `UserWallet` keying so `privyUserId` is the stable primary identity and `stellarAddress` can change without a unique-constraint hazard. |
| P3 | Add a lightweight `/api/session/ping` the client can hit on `visibilitychange` to refresh the cookie proactively when a tab is re-focused. |
