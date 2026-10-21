/**
 * New Investor sign-ups stay off unless a Testnet demo explicitly enables
 * them. Fondealo does not run a public investment marketplace (see
 * docs/strategy/2026-10-19-strategy-audit.md §5); existing Investor accounts
 * keep access to their positions either way.
 */
export const INVESTOR_SIGNUP_ENABLED = process.env.NEXT_PUBLIC_INVESTOR_SIGNUP === 'true';
