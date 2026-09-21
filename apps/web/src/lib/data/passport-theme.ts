import { prisma } from '@fondealo/database';
import { describeError } from '@/lib/auth/session';
import { DEFAULT_PASSPORT_THEME, parseTheme, type PassportTheme } from '@/lib/passport-theme';

/** The look a business chose for its Passport. Falls back to the default if none is saved or the database is unreachable. */
export async function getPassportTheme(address: string): Promise<PassportTheme> {
  try {
    const business = await prisma.business.findUnique({
      where: { stellarAddress: address },
      select: { passportTheme: true, passportAccent: true, passportPattern: true },
    });
    if (!business) return DEFAULT_PASSPORT_THEME;
    return parseTheme({
      preset: business.passportTheme,
      accent: business.passportAccent,
      pattern: business.passportPattern,
    });
  } catch (err) {
    console.error('[passport-theme] read failed:', describeError(err));
    return DEFAULT_PASSPORT_THEME;
  }
}
