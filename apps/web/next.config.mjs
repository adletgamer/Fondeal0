import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Monorepo: the single source of truth for secrets is the repo-root .env.
// Next only auto-loads apps/web/.env*, so pull the root file in too.
// loadEnvFile never overrides variables that are already set (real env on
// Vercel, or apps/web/.env.local), and is skipped when the file is absent.
const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile workspace packages from source (they ship .ts/.tsx, not built dist).
  transpilePackages: ['@fondealo/ui', '@fondealo/sdk', '@fondealo/types', '@fondealo/database'],
};

export default nextConfig;
