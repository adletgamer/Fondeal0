import type { Config } from 'tailwindcss';

/** A colour backed by a design token (`packages/ui/src/styles.css`). */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
/** A full scale whose steps switch with the theme (Day ↔ Night). */
const scale = (family: string) =>
  Object.fromEntries(STEPS.map((s) => [s, token(`${family}-${s}`)]));

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/**/*.{ts,tsx}',
    // Include workspace UI package so its Tailwind classes are generated.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1152px' },
    },
    extend: {
      colors: {
        // Theme-aware scales: Day keeps Tailwind's values, Night re-maps each
        // step so existing `slate-*`/`brand-*` classes read correctly on dark.
        slate: scale('slate'),
        red: scale('red'),
        orange: scale('orange'),
        amber: scale('gold'),
        emerald: scale('brand'),
        brand: {
          ...scale('brand'),
          DEFAULT: token('brand-600'),
          fill: token('brand-fill'),
          hover: token('brand-hover'),
          text: token('brand-text'),
          soft: token('brand-soft'),
          line: token('brand-line'),
        },
        gold: {
          ...scale('gold'),
          DEFAULT: token('gold-500'),
          fill: token('gold-fill'),
          text: token('gold-text'),
          soft: token('gold-soft'),
        },
        // Semantic tokens from the Fondealo design system.
        surface: {
          0: token('surface-0'),
          100: token('surface-100'),
          200: token('surface-200'),
          300: token('surface-300'),
        },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        ink: { DEFAULT: token('ink'), muted: token('ink-muted'), faint: token('ink-faint') },
        'on-brand': token('on-brand'),
        'on-gold': token('on-gold'),
        'on-band': '#070b16',
        holo: token('holo'),
        info: { text: token('info-text'), soft: token('info-soft') },
        danger: { text: token('danger-text'), soft: token('danger-soft') },
        'focus-ring': token('focus-ring'),
        band: {
          a: '#6ee7b7',
          b: '#34d399',
          c: '#fcd34d',
          d: '#fdba74',
          e: '#fca5a5',
        },
        night: {
          700: '#141d33',
          800: '#0f1728',
          900: '#0b1120',
          950: '#070b16',
          DEFAULT: '#0b1120',
        },
      },
      // `bg-white` is a surface (flips to night-900 in Night); `text-white`
      // and `border-white/*` stay literal white for dark islands.
      backgroundColor: {
        white: token('bg-white'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
        'radial-brand':
          'radial-gradient(60% 60% at 50% 0%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0) 70%)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(2,6,23,0.06), 0 8px 24px -12px rgba(2,6,23,0.18)',
        glow: '0 0 0 1px rgba(16,185,129,0.25), 0 20px 60px -20px rgba(16,185,129,0.45)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
