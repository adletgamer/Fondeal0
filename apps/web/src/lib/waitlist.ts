/**
 * Early-access waitlist — shared options and copy. Isomorphic on purpose:
 * the landing form (PR 3) renders these labels and the server action
 * validates against the same values. Values are the stored enum names;
 * labels are es-PE (docs/strategy/2026-10-20-landing-refactor-plan.md §7).
 */

export const WAITLIST_PROFILES = [
  'StartupPreSeed',
  'StartupRevenue',
  'Mype',
  'Funder',
  'Other',
] as const;
export type WaitlistProfile = (typeof WAITLIST_PROFILES)[number];

export const WAITLIST_PROFILE_LABELS: Record<WaitlistProfile, string> = {
  StartupPreSeed: 'Startup que se prepara para una ronda (pre-seed o seed)',
  StartupRevenue: 'Startup con ingresos que busca financiamiento sin ceder acciones',
  Mype: 'MYPE que busca financiamiento',
  Funder: 'Trabajo en un fondo, aceleradora o entidad que financia empresas',
  Other: 'Otro',
};

export const WAITLIST_COUNTRIES = [
  'Peru',
  'UnitedStates',
  'OtherCountry',
  'NotIncorporated',
] as const;
export type WaitlistCountry = (typeof WAITLIST_COUNTRIES)[number];

export const WAITLIST_COUNTRY_LABELS: Record<WaitlistCountry, string> = {
  Peru: 'Perú',
  UnitedStates: 'Estados Unidos (por ejemplo, Delaware)',
  OtherCountry: 'Otro país',
  NotIncorporated: 'Aún no está constituida',
};

/** Bump whenever WAITLIST_CONSENT_TEXT changes; stored with every entry. */
export const WAITLIST_CONSENT_VERSION = 'waitlist-v1';

/** Pending legal review (plan §7, §11). Shown next to the required checkbox. */
export const WAITLIST_CONSENT_TEXT =
  'Acepto que Fondealo use mi correo, perfil y país de constitución para avisarme del acceso anticipado y, si lo marco abajo, invitarme a una entrevista. Puedo pedir que borren mis datos cuando quiera.';

export const WAITLIST_DISCLAIMER =
  'Unirte a la lista no es una solicitud de financiamiento. Fondealo no presta, no invierte ni intermedia inversiones.';

/** Honeypot field name: real people never see or fill it. */
export const WAITLIST_HONEYPOT_FIELD = 'website';

export type WaitlistField = 'email' | 'profile' | 'country' | 'companyName' | 'consent';

export type WaitlistLocale = 'es' | 'en';

export const WAITLIST_PROFILE_LABELS_EN: Record<WaitlistProfile, string> = {
  StartupPreSeed: 'Startup preparing a round (pre-seed or seed)',
  StartupRevenue: 'Revenue-stage startup seeking financing without giving up equity',
  Mype: 'Small business looking for financing',
  Funder: 'I work at a fund, accelerator or company that finances businesses',
  Other: 'Other',
};

export const WAITLIST_COUNTRY_LABELS_EN: Record<WaitlistCountry, string> = {
  Peru: 'Peru',
  UnitedStates: 'United States (for example, Delaware)',
  OtherCountry: 'Another country',
  NotIncorporated: 'Not incorporated yet',
};

/** English consent copy is a different text, so it carries its own version. */
export const WAITLIST_CONSENT_TEXT_EN =
  'I agree that Fondealo may use my email, profile and country of incorporation to tell me about early access and, if I tick the box below, to invite me to an interview. I can ask for my data to be deleted at any time.';

export const WAITLIST_DISCLAIMER_EN =
  'Joining the list is not a financing application. Fondealo does not lend, invest or intermediate investments.';

export const waitlistConsentVersion = (locale: WaitlistLocale) =>
  locale === 'en' ? `${WAITLIST_CONSENT_VERSION}-en` : WAITLIST_CONSENT_VERSION;

/** Server messages by key, so the action answers in the visitor's language. */
export type WaitlistMessageKey =
  | 'email.required'
  | 'email.long'
  | 'email.invalid'
  | 'profile'
  | 'country'
  | 'companyName.long'
  | 'consent'
  | 'summary'
  | 'rateLimited'
  | 'unavailable';

export const WAITLIST_MESSAGES: Record<WaitlistLocale, Record<WaitlistMessageKey, string>> = {
  es: {
    'email.required': 'Escribe tu correo.',
    'email.long': 'Revisa tu correo. Parece demasiado largo.',
    'email.invalid': 'Revisa tu correo. Parece que le falta algo, por ejemplo la @.',
    profile: 'Elige la opción que mejor te describe.',
    country: 'Elige dónde está constituida tu empresa.',
    'companyName.long': 'Usa como máximo 120 caracteres.',
    consent: 'Para unirte, marca la casilla de consentimiento.',
    summary: 'Revisa los campos marcados.',
    rateLimited: 'Recibimos varios intentos seguidos. Espera unos minutos e inténtalo otra vez.',
    unavailable: 'No pudimos guardar tus datos. Revisa tu conexión e inténtalo de nuevo.',
  },
  en: {
    'email.required': 'Enter your email.',
    'email.long': 'Check your email. It looks too long.',
    'email.invalid': 'Check your email. It seems to be missing something, such as the @.',
    profile: 'Choose the option that describes you best.',
    country: 'Choose where your company is incorporated.',
    'companyName.long': 'Use 120 characters at most.',
    consent: 'To join, tick the consent box.',
    summary: 'Check the highlighted fields.',
    rateLimited: 'We received several attempts in a row. Wait a few minutes and try again.',
    unavailable: 'We could not save your details. Check your connection and try again.',
  },
};
