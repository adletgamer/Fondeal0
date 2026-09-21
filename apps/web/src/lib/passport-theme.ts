/**
 * Passport theming — the *identity layer* only.
 *
 * A business can restyle how its Passport looks (colours, pattern) but never
 * its credit semantics: score, risk band, KYB status and repayment history are
 * rendered by the fixed "trust layer" and set by Fondealo. Theme data is
 * off-chain presentation metadata; it is never written to the credit fields of
 * the on-chain Passport (see docs/adr/0009-non-transferable-business-passport.md).
 *
 * Isomorphic on purpose: the customizer previews with the same code the server
 * uses to validate what it saves.
 */

export const PASSPORT_PRESET_IDS = [
  'emerald',
  'cyan',
  'aurora',
  'violet',
  'gold',
  'custom',
] as const;
export type PassportPresetId = (typeof PASSPORT_PRESET_IDS)[number];

export const PASSPORT_PATTERNS = ['lines', 'dots', 'none'] as const;
export type PassportPattern = (typeof PASSPORT_PATTERNS)[number];

export interface PassportTheme {
  preset: PassportPresetId;
  /** `#rrggbb`; only meaningful when `preset` is `custom`. */
  accent: string | null;
  pattern: PassportPattern;
}

export interface ThemePalette {
  /** Highlight. */
  a: string;
  /** Mid tone. */
  b: string;
  /** Deep base tint. */
  c: string;
  /** Glow colour (used with alpha by the CSS). */
  glow: string;
}

export const DEFAULT_PASSPORT_THEME: PassportTheme = {
  preset: 'emerald',
  accent: null,
  pattern: 'lines',
};

interface PresetDef {
  id: Exclude<PassportPresetId, 'custom'>;
  label: string;
  palette: ThemePalette;
}

export const PASSPORT_PRESETS: PresetDef[] = [
  {
    id: 'emerald',
    label: 'Emerald',
    palette: { a: '#34d399', b: '#10b981', c: '#064e3b', glow: '#10b981' },
  },
  {
    id: 'cyan',
    label: 'Electric cyan',
    palette: { a: '#67e8f9', b: '#06b6d4', c: '#164e63', glow: '#22d3ee' },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    palette: { a: '#34d399', b: '#22d3ee', c: '#4c1d95', glow: '#7c3aed' },
  },
  {
    id: 'violet',
    label: 'Violet',
    palette: { a: '#c4b5fd', b: '#8b5cf6', c: '#4c1d95', glow: '#8b5cf6' },
  },
  {
    id: 'gold',
    label: 'Midnight gold',
    palette: { a: '#fde68a', b: '#f59e0b', c: '#3b2a0a', glow: '#f59e0b' },
  },
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

/* ------------------------------ colour maths ------------------------------ */

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/**
 * Builds a full palette from a single accent. Lightness/saturation are clamped
 * so the identity panel always stays dark enough for white text, whatever the
 * user picks (even pure white or black).
 */
export function paletteFromAccent(accent: string): ThemePalette {
  const [h, s0, l0] = hexToHsl(accent);
  const s = Math.max(0.45, Math.min(0.95, s0 || 0.6));
  const mid = Math.max(0.42, Math.min(0.62, l0));
  return {
    a: hslToHex(h, s, Math.min(0.78, mid + 0.18)),
    b: hslToHex(h, s, mid),
    c: hslToHex((h + 22) % 360, Math.min(0.6, s), 0.11),
    glow: hslToHex(h, s, mid),
  };
}

export function paletteFor(theme: PassportTheme): ThemePalette {
  if (theme.preset === 'custom' && isHexColor(theme.accent)) {
    return paletteFromAccent(theme.accent);
  }
  const preset = PASSPORT_PRESETS.find((p) => p.id === theme.preset) ?? PASSPORT_PRESETS[0]!;
  return preset.palette;
}

/** A preset's swatch as a CSS gradient (for the picker chips). */
export function swatchGradient(id: PassportPresetId, accent?: string | null): string {
  const p =
    id === 'custom' && isHexColor(accent)
      ? paletteFromAccent(accent)
      : (PASSPORT_PRESETS.find((x) => x.id === id)?.palette ?? PASSPORT_PRESETS[0]!.palette);
  return `linear-gradient(135deg, ${p.a}, ${p.b} 55%, ${p.c})`;
}

/* ------------------------------- validation ------------------------------- */

/** Coerces untrusted input (form data, DB rows) into a valid theme. Never throws. */
export function parseTheme(input: {
  preset?: unknown;
  accent?: unknown;
  pattern?: unknown;
}): PassportTheme {
  const preset = PASSPORT_PRESET_IDS.includes(input.preset as PassportPresetId)
    ? (input.preset as PassportPresetId)
    : DEFAULT_PASSPORT_THEME.preset;
  const pattern = PASSPORT_PATTERNS.includes(input.pattern as PassportPattern)
    ? (input.pattern as PassportPattern)
    : DEFAULT_PASSPORT_THEME.pattern;
  const accent = isHexColor(input.accent) ? input.accent.toLowerCase() : null;
  // A custom preset without a valid colour falls back to the default look.
  if (preset === 'custom' && !accent) return { ...DEFAULT_PASSPORT_THEME, pattern };
  return { preset, accent: preset === 'custom' ? accent : null, pattern };
}

/** CSS variables the Passport card reads. */
export function themeStyleVars(theme: PassportTheme): Record<string, string> {
  const p = paletteFor(theme);
  return { '--t-a': p.a, '--t-b': p.b, '--t-c': p.c, '--t-glow': p.glow };
}
