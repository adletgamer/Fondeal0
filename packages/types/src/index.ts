/**
 * @fondealo/types — shared domain types + zod schemas.
 *
 * These mirror the on-chain `business_passport` contract shapes and the
 * off-chain Postgres projection, so the web app, SDK, and database layer all
 * speak one vocabulary. On-chain remains authoritative for anything trust-bearing.
 */
export * from './passport';
export * from './lending';
