# ADR-0010: KYB evidence boundary for intake

**Status:** Accepted for PR 1 implementation, 2026-10-12. This is an application design decision, not approval to collect real documents or deploy to Production.

## Decision

The existing `Business` and `KybSubmission` records remain the case anchor. `EvidenceReference` records declared evidence types, `ProviderCheck` records a normalized check, and `VerificationAuditEvent` records consent and access. The business identity and role come from a verified Privy session. Intake remains `Processing` regardless of sandbox output.

Document uploads are disabled. A declaration is not a scanned document or registry verification. The Peru registry adapter returns `Unavailable` until a supported authorized endpoint, credentials, terms, privacy review and monitoring are approved. No government site scraping is permitted.

The upload interface has metadata limits, but cannot accept files yet. Before enabling it, require private object storage with isolated Development and Production buckets, server-side encryption, short-lived owner-bound upload grants, content sniffing, malware scanning before read availability, no public ACL or URL, access audit, retention enforcement and deletion verification. Missing scanner or storage health must fail closed.

## Retention and access policy gate

Proposed policy for legal/privacy review: delete unsubmitted drafts from the browser when the session ends; retain unreviewed declarations and audit events for a defined period that Risk and Legal approve; retain verified case evidence only for the legally required period. Do not select an arbitrary production period in code. Until approved, collect no document bytes. Only the submitting Business may read its own declaration metadata; a future reviewer needs a separate least-privilege role and immutable access audit. Never return storage keys, raw PII or presigned read URLs from this endpoint.

## Failure and rollback

Provider timeout, malformed response or missing credentials becomes `Unavailable`, with no approval or Passport issuance. The additive migration can be deployed only after the prior underwriting migration is confirmed on isolated Development. Roll back application code first if necessary; retain the new tables and audit history for review. Do not delete case records or revert a migration with user data.
