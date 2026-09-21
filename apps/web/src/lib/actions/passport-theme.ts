'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@fondealo/database';
import { describeError, getSession } from '@/lib/auth/session';
import {
  PASSPORT_PATTERNS,
  PASSPORT_PRESET_IDS,
  isHexColor,
  parseTheme,
  type PassportPattern,
  type PassportPresetId,
  type PassportTheme,
} from '@/lib/passport-theme';

export type ThemeResult =
  { ok: true; message: string; theme: PassportTheme } | { ok: false; error: string };

/**
 * Saves how the caller's Passport looks. This is presentation only: it writes
 * three off-chain columns and can never touch score, risk band, KYB status or
 * any other credit field — those are rendered by the fixed trust layer.
 */
export async function savePassportTheme(
  _prev: ThemeResult | null,
  formData: FormData,
): Promise<ThemeResult> {
  const session = await getSession();
  if (!session?.stellarAddress) {
    return { ok: false, error: 'Your session expired. Refresh the page and log in again.' };
  }
  if (session.role !== 'Business') {
    return { ok: false, error: 'Only business accounts can style a Passport.' };
  }

  const preset = String(formData.get('preset') ?? '');
  const pattern = String(formData.get('pattern') ?? '');
  const accent = String(formData.get('accent') ?? '');

  if (!PASSPORT_PRESET_IDS.includes(preset as PassportPresetId)) {
    return { ok: false, error: 'Pick one of the available colour themes.' };
  }
  if (!PASSPORT_PATTERNS.includes(pattern as PassportPattern)) {
    return { ok: false, error: 'Pick one of the available patterns.' };
  }
  if (preset === 'custom' && !isHexColor(accent)) {
    return { ok: false, error: 'Enter a valid colour, like #22d3ee.' };
  }

  const theme = parseTheme({ preset, accent, pattern });

  try {
    await prisma.business.update({
      where: { stellarAddress: session.stellarAddress },
      data: {
        passportTheme: theme.preset,
        passportAccent: theme.accent,
        passportPattern: theme.pattern,
      },
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') {
      return { ok: false, error: 'Verify your business first — then you can style its Passport.' };
    }
    console.error('[savePassportTheme] failed:', describeError(err));
    return { ok: false, error: 'We could not save your theme. Try again in a moment.' };
  }

  revalidatePath('/business', 'layout');
  revalidatePath('/invest', 'layout');
  return { ok: true, message: 'Passport look saved.', theme };
}
