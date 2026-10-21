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
