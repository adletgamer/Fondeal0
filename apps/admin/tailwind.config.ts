import type { Config } from 'tailwindcss';
import web from '../web/tailwind.config';

/**
 * The back-office uses the public app's design tokens unchanged (Night is the
 * default theme), so a colour or type change lands in both. Only the content
 * globs differ. When a third app needs this, lift the shared theme into
 * `packages/ui` as a Tailwind preset.
 */
const config: Config = {
  ...web,
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
