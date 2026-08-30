/**
 * Shared by both apps/web/src/lib/auth/session.ts (Node runtime — verifies
 * the token, reads the database) and middleware.ts (Edge runtime — only
 * checks the cookie's presence). Kept in its own file with zero other
 * imports so middleware.ts can use the same cookie name without pulling
 * Prisma or @privy-io/server-auth into the Edge bundle.
 */
export const SESSION_COOKIE_NAME = 'fondealo_session';
