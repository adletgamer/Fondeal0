# Business economic profiles and ES/EN dashboards

Implemented in code on 2026-10-25. The new migration was applied only to the isolated local Development database. Hosted database migration and Production activation remain separate release gates.

## Account identity and economic profile are different boundaries

`/onboarding` still performs authentication, embedded Stellar wallet creation and write-once account-role selection. A newly assigned Business role continues to `/business/onboarding`; an existing Business account continues to `/business`. Existing Investor routing and `INVESTOR_SIGNUP_ENABLED` are unchanged.

`/business/onboarding` collects a self-reported economic profile in five steps: company, cash flow, financing purpose, ranges and summary. The initial cash-flow paths are B2B receivables, recurring revenue, other operating revenue and pre-revenue. B2B appears first; company labels such as startup/SME never act as an eligibility decision.

The client and server share the cash-flow/use-case constraints in `@fondealo/types`. The server takes the owner from the verified session, accepts only a Business role and rejects client-supplied authority fields: the input schemas explicitly reject extra addresses, business IDs, roles and approval flags. A serializable transaction creates/updates the caller's company and its one-to-one `BusinessFinancingProfile`. Previously submitted KYB identity details are preserved. `Business.revenueBand` is reused; it is not duplicated in the financing profile.

Pre-revenue profiles contain no debt purpose, requested amount or term. Completing any profile is not KYB, underwriting, Passport or financing approval and never creates a credit score. `canRequestFinancing`, funding/repayment guards and staff authority remain independent. The summary gives indicative future evidence guidance and requests no document uploads or exact bank balances.

`getBusinessOnboardingState(session)` derives `NO_BUSINESS`, `PROFILE_INCOMPLETE`, `PROFILE_COMPLETE` or `PRE_REVENUE` from stored data/version/completion time. `UNAVAILABLE` is separate from incomplete: a failed query or missing migration cannot silently manufacture a profile or lock an existing user out of the dashboard. Existing users see a completion link and may keep accessing their dashboard and obligations. No new profile requirement was added to historical repayments or financing eligibility.

## Storage, privacy and migration

`20261025180000_business_financing_profile` adds stable enums and two tables:

- `BusinessFinancingProfile`: one row per business, cash flow, contextual purpose, USD amount range, term range, optional B2B share, server-assigned version and timestamps. PostgreSQL checks enforce the cash-flow/terms/use-case constraints.
- `BusinessProfileEvent`: append-only `Saved`, `Viewed` and `DeletionRequested` events attributed to the verified actor. The record contains no document payloads or bank data. A partial unique index limits deletion requests to one per company; a trigger prevents modifying/removing events.

The separate profile event stream is necessary because a company can now exist before a KYB submission; existing verification-audit events require a KYB reference. No synthetic KYB application is created merely to audit a profile.

`/business/datos` displays the profile and records reads even before KYB starts. Profile-only companies can request deletion using the same manual-review semantics as existing requests. There is no automatic deletion or new sharing with funders. Existing KYB commitments, salts, provider checks, decisions and migrations are preserved.

Before a hosted rollout, verify the target is the intended isolated Development database, review/apply the committed migration with `db:deploy` and verify `db:status`. Do not run `db:push` to replace the migration: the append-only trigger and partial unique index are intentional database safeguards. The application reports profile unavailability if the table is absent; that fallback is not evidence that deployment is complete. Production migration requires the existing release process.

## Language preference

Business and Investor shells expose ES/EN at desktop and mobile sizes. A dedicated `fondealo_locale` cookie stores only the presentation preference; it never changes `fondealo_session`, a wallet address or a role. The action accepts only `es`/`en`, uses a year-long `HttpOnly`, `SameSite=Lax` cookie and enables `Secure` in Production.

Server-rendered pages read the same preference as the client context. The selector refreshes the current route while preserving client state, so navigation, tables, market filters, forms, status text, errors and number/date formatting agree. Account onboarding and the new economic-profile flow also use the preference. Dates retain the existing America/Lima display zone.

`app-copy.ts`/`app-messages.ts` contain shared source-text translations. Core enum codes, submitted form values, user-authored company/opportunity names and authorization comparisons are never translated. Unknown operation errors have a localized recoverable message; supported dynamic feedback uses bounded message templates. New copy must supply both languages.

KYB intake sends its display locale with the consent submission. English consent is recorded as `kyb-intake-v1-en`; existing Spanish clients retain `kyb-intake-v1`. The locale and version are recorded in consent audit metadata. This documents the displayed translation; it does not turn the draft privacy policy into an approved legal notice.

## Investor presentation

The existing dashboard layout is retained. It now includes active/defaulted position counts, a direct test-market action, horizontal scrolling for narrow position tables, accessible market controls and a reset-filters action. Estimated totals are explicitly estimates rather than actual payouts; test balances and model collateral coverage are not represented as settled real funds. No payment/signing flow or investment availability was enabled.

## Validation boundaries

Tests cover shared segmentation constraints, owner/role guards, forged identity/approval fields, KYB identity preservation, new/legacy routing, pre-revenue storage, database outages, profile-only data access/deletion, immutable audit, bilingual consent provenance and ES/EN rendering/preference isolation. The existing role, KYB, underwriting and ledger regressions continue to run. Interactive browser checks use synthetic fixtures outside the application and the real unauthenticated language selector; they do not establish a live authenticated Privy/chain workflow.
