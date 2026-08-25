# ADR-0006: Non-custodial value flow + SEP-10 wallet auth

- **Status:** Accepted
- **Date:** 2026-08-25

## Context
Moving investor USDC implicates money-transmission/securities rules that vary by jurisdiction (Peru/LatAm). We want minimal regulatory blast radius for a testnet MVP and a credible path to mainnet. We also need authentication.

## Decision
**Non-custodial by default.** Value moves through **contract escrow** and **user-signed** transactions; Fondealo never holds business/investor private keys or a pooled hot wallet in MVP. **Authentication uses SEP-10** (wallet signs a challenge → JWT session), integrated via **Stellar Wallets Kit** (Freighter primary; xBull/Albedo/Lobstr/Hana/passkeys supported). All USDC uses the **Stellar Asset Contract**; no custom token.

## Consequences
- (+) Smaller regulatory surface; users retain custody; passwordless, cryptographic login; standards-native and anchor-interoperable.
- (+) Reviewer-legible security story for the Build Award tranche-2 threat model.
- (−) UX friction (users must sign; wallet onboarding); mitigated by passkey/smart-wallet flows in Wallets Kit.
- (−) Some flows (e.g. pooled disbursement at scale via SDP) may later need custodial/anchor components with proper licensing — explicitly a post-MVP decision.

## Alternatives considered
- Custodial pooled fund (Fondealo hot wallet) — rejected for MVP: regulatory/security risk, key-management liability.
- Email/password + managed keys — rejected: not standards-native, weaker trust story, custody creep.
