import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Unit tests for the off-chain money paths in apps/web.
 *
 * Node environment on purpose: every test here exercises server-side logic
 * (server actions, the ledger) and nothing renders. Component tests would need
 * jsdom and a different setup, and are out of scope for SA1.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
