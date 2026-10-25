# RFC 0003: Bounded x402 evidence acquisition

**Status:** Local implementation, Testnet buyer disabled by default
**Date:** 2026-10-25

## Scope

Prove one path from a synthetic paid evidence response to a normalized `ProviderCheck` and `EvidenceReference`. This is acquisition infrastructure only. It does not authenticate staff, decide KYB, score credit, create an `UnderwritingDecision`, issue a Passport, or make a financing decision. A licensed lender, factor, or other capital provider keeps final credit authority.

This implementation builds on the staff roles, decision workflow and deployment safeguards documented in ADRs 0011 and 0012. The x402 service itself remains disconnected from authenticated routes and UI actions. Capability flags in `apps/admin/src/lib/env.ts` keep staff authentication, persisted decisions and Passport issuance disabled; spending must not be callable by an unauthenticated reviewer surface.

## Implemented path

1. A server module accepts only consented synthetic Peru `ENTITY_STATUS` requests for `PE:20123456789`.
2. `SyntheticPeruRegistryProvider` makes an unpaid request and accepts one exact-scheme quote on `stellar:testnet`, using the Testnet USDC contract address from Stellar documentation.
3. `ServerPolicyAuthorizer` enforces the provider, country, evidence type, network, token contract, configured recipient, quote freshness, per-call cap and cumulative application/day limits.
4. The Prisma repository serializes budget reservation in a transaction with a database advisory lock. This closes the concurrent-request race that a check-then-write cap would leave.
5. The adapter re-fetches the quote and compares terms before creating a payment payload with the official `@x402/fetch` and `@x402/stellar` client packages. It accepts the paid response only after successful settlement is confirmed for Testnet.
6. The synthetic JSON response is schema checked and its Ed25519 signature is verified against a configured public key in memory; only its SHA-256 hash, transaction reference and normalized result are persisted. Raw response JSON is not stored. The provider signature covers canonical JSON fields with the `signature` property omitted.
7. An additive `EvidenceAcquisition` row captures quote/payment metadata. `ProviderCheck` is linked to it, and `EvidenceReference` is linked to the normalized check. Finalization and its audit event share one DB transaction.
8. Evidence acquisition cannot create or alter an underwriting decision.

## Limits

The current local policy allows at most 0.02 USDC per call, 0.05 USDC per KYB submission, and 0.10 USDC across all applications per UTC day. Values use Stellar token base units (seven decimal places per the x402 Stellar implementation). The recipient is supplied as a local configuration allowlist and must exactly match the x402 quote.

`ENABLE_LOCAL_X402_EVIDENCE=true` is necessary but not sufficient. The service factory also requires development mode, a configured synthetic provider URL and matching allowed origin, an allowlisted recipient, and a server-only Testnet signer secret. It is currently not connected to the admin UI or HTTP routes. Never use this local Testnet signer for mainnet or expose it to a browser.

The only supported provider is synthetic. It enforces a fixed demo subject and HTTPS or loopback HTTP. There is no SUNAT integration and no public provider discovery. The policy authorizer is independent from the wallet implementation; an OpenZeppelin Smart Account authorizer can be introduced behind `PaymentAuthorizer` after its Testnet setup and policy are reviewed.

## Data model decision

`ProviderCheck` describes what was verified and `EvidenceReference` describes which evidence exists. Neither records the x402 quote, exact payment network and token, paid amount, settlement transaction, request/response hashes, acquisition lifecycle, or acquisition-specific idempotency state. An additive `EvidenceAcquisition` model therefore represents distinct data rather than duplicating either record. It stores no provider response payload and no private key.

## Required before wiring a staff action

- Before connecting the service to an admin action, enforce the existing staff permissions server-side and identify the authorized actor in the audit trail. Evidence purchase is not a credit decision, but it still spends funds.
- Preserve the review/approver separation and maker-checker policy for every KYB or underwriting decision; evidence acquisition must never create or change a decision.
- Establish and verify an isolated Development database target; review and apply the additive migration there only.
- Replace the generic service audit actor with the authenticated staff or delegated service principal required by the approved audit model.
- Add tests for the live x402 client transport and facilitator settlement against a synthetic Testnet provider without involving real data.

## Sources

- [Stellar x402 overview](https://developers.stellar.org/docs/build/agentic-payments/x402)
- [Stellar x402 quickstart](https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide)
- [OpenZeppelin Stellar Smart Accounts](https://docs.openzeppelin.com/stellar-contracts/accounts/smart-account)
