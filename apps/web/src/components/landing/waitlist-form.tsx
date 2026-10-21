'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Button, Field, SelectField } from '@fondealo/ui';
import { joinWaitlist, type WaitlistResult } from '@/lib/actions/waitlist';
import {
  WAITLIST_CONSENT_TEXT,
  WAITLIST_CONSENT_TEXT_EN,
  WAITLIST_COUNTRIES,
  WAITLIST_COUNTRY_LABELS,
  WAITLIST_COUNTRY_LABELS_EN,
  WAITLIST_DISCLAIMER,
  WAITLIST_DISCLAIMER_EN,
  WAITLIST_HONEYPOT_FIELD,
  WAITLIST_PROFILES,
  WAITLIST_PROFILE_LABELS,
  WAITLIST_PROFILE_LABELS_EN,
  type WaitlistField,
  type WaitlistLocale,
} from '@/lib/waitlist';

const FIELD_ID: Record<WaitlistField, string> = {
  email: 'waitlist-email',
  profile: 'waitlist-profile',
  country: 'waitlist-country',
  companyName: 'waitlist-company',
  consent: 'waitlist-consent',
};

const COPY = {
  es: {
    labels: {
      email: 'Correo',
      profile: '¿Qué te describe mejor?',
      country: '¿Dónde está constituida tu empresa?',
      companyName: 'Nombre de tu empresa o startup',
      consent: 'Consentimiento',
    },
    required: 'obligatorio',
    optional: 'opcional',
    emailHint: 'Solo te escribiremos sobre el acceso anticipado.',
    choose: 'Elige una opción…',
    honeypot: 'No completes este campo',
    interview:
      'Acepto que me inviten a una entrevista de 30 minutos para mejorar Fondealo (opcional).',
    submit: 'Unirme a la lista de espera',
    sending: 'Enviando…',
    successTitle: '¡Listo, ya estás en la lista!',
    success: (email: string) => [
      'Te escribiremos a ',
      email,
      ' cuando abramos el acceso. No necesitas hacer nada más.',
    ],
    profiles: WAITLIST_PROFILE_LABELS,
    countries: WAITLIST_COUNTRY_LABELS,
    consentText: WAITLIST_CONSENT_TEXT,
    disclaimer: WAITLIST_DISCLAIMER,
  },
  en: {
    labels: {
      email: 'Email',
      profile: 'What describes you best?',
      country: 'Where is your company incorporated?',
      companyName: 'Company or startup name',
      consent: 'Consent',
    },
    required: 'required',
    optional: 'optional',
    emailHint: 'We will only write to you about early access.',
    choose: 'Choose an option…',
    honeypot: 'Leave this field empty',
    interview: 'I agree to be invited to a 30-minute interview to improve Fondealo (optional).',
    submit: 'Join the waitlist',
    sending: 'Sending…',
    successTitle: 'Done, you are on the list!',
    success: (email: string) => [
      'We will write to ',
      email,
      ' when access opens. You do not need to do anything else.',
    ],
    profiles: WAITLIST_PROFILE_LABELS_EN,
    countries: WAITLIST_COUNTRY_LABELS_EN,
    consentText: WAITLIST_CONSENT_TEXT_EN,
    disclaimer: WAITLIST_DISCLAIMER_EN,
  },
} as const;

export interface WaitlistValues {
  email: string;
  profile: string;
  country: string;
  companyName: string;
  consent: boolean;
  interviewOptIn: boolean;
}

const EMPTY: WaitlistValues = {
  email: '',
  profile: '',
  country: '',
  companyName: '',
  consent: false,
  interviewOptIn: false,
};

const control = '[&_input]:h-12 [&_select]:h-12';

/**
 * Pure view of the form, so every state (empty, errors, success) can be
 * rendered and tested without running the action.
 */
export function WaitlistFormView({
  locale = 'es',
  result,
  pending,
  values,
  onChange,
  formAction,
}: {
  locale?: WaitlistLocale;
  result: WaitlistResult | null;
  pending: boolean;
  values: WaitlistValues;
  onChange: (patch: Partial<WaitlistValues>) => void;
  formAction?: (formData: FormData) => void;
}) {
  const t = COPY[locale];
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const fieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  // Move focus to whatever the submit produced: the error summary or the success heading.
  useEffect(() => {
    if (!result) return;
    if (result.ok) successRef.current?.focus();
    else summaryRef.current?.focus();
  }, [result]);

  if (result?.ok) {
    const [before, email, after] = t.success(result.email);
    return (
      <div role="status" className="space-y-3 py-6">
        <span
          aria-hidden
          className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand-text"
        >
          <svg viewBox="0 0 16 16" width="22" height="22" fill="none">
            <path
              d="m3.5 8.5 3 3 6-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <h3
          ref={successRef}
          tabIndex={-1}
          className="text-xl font-semibold text-ink focus:outline-none"
        >
          {t.successTitle}
        </h3>
        <p className="text-base text-ink-muted">
          {before}
          <span className="font-medium text-ink">{email}</span>
          {after}
        </p>
      </div>
    );
  }

  const errorEntries = Object.entries(fieldErrors) as [WaitlistField, string][];
  const req = (label: string) => `${label} (${t.required})`;

  return (
    <form action={formAction} noValidate className="space-y-5" aria-describedby="waitlist-note">
      <input type="hidden" name="locale" value={locale} />
      {result && !result.ok ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-danger-text/50 bg-danger-soft p-4 text-sm text-danger-text focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <p className="font-semibold">{result.error}</p>
          {errorEntries.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorEntries.map(([field, message]) => (
                <li key={field}>
                  <a href={`#${FIELD_ID[field]}`} className="underline">
                    {t.labels[field]}: {message}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <Field
        id={FIELD_ID.email}
        name="email"
        type="email"
        label={req(t.labels.email)}
        autoComplete="email"
        inputMode="email"
        required
        aria-required
        value={values.email}
        onChange={(e) => onChange({ email: e.target.value })}
        error={fieldErrors.email}
        hint={t.emailHint}
        className={control}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id={FIELD_ID.profile}
          name="profile"
          label={req(t.labels.profile)}
          required
          aria-required
          value={values.profile}
          onChange={(e) => onChange({ profile: e.target.value })}
          error={fieldErrors.profile}
          className={control}
        >
          <option value="">{t.choose}</option>
          {WAITLIST_PROFILES.map((p) => (
            <option key={p} value={p}>
              {t.profiles[p]}
            </option>
          ))}
        </SelectField>

        <SelectField
          id={FIELD_ID.country}
          name="country"
          label={req(t.labels.country)}
          required
          aria-required
          value={values.country}
          onChange={(e) => onChange({ country: e.target.value })}
          error={fieldErrors.country}
          className={control}
        >
          <option value="">{t.choose}</option>
          {WAITLIST_COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {t.countries[c]}
            </option>
          ))}
        </SelectField>
      </div>

      <Field
        id={FIELD_ID.companyName}
        name="companyName"
        label={`${t.labels.companyName} (${t.optional})`}
        autoComplete="organization"
        value={values.companyName}
        onChange={(e) => onChange({ companyName: e.target.value })}
        error={fieldErrors.companyName}
        className={control}
      />

      {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          {t.honeypot}
          <input type="text" name={WAITLIST_HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-3 rounded-xl bg-surface-200/70 p-4">
        <label
          htmlFor={FIELD_ID.consent}
          className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink"
        >
          <input
            id={FIELD_ID.consent}
            type="checkbox"
            name="consent"
            required
            aria-required
            aria-invalid={fieldErrors.consent ? true : undefined}
            aria-describedby={fieldErrors.consent ? 'waitlist-consent-error' : undefined}
            checked={values.consent}
            onChange={(e) => onChange({ consent: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand-fill"
          />
          <span>
            {t.consentText} <span className="text-ink-muted">({t.required})</span>
          </span>
        </label>
        {fieldErrors.consent ? (
          <p id="waitlist-consent-error" className="pl-8 text-sm text-danger-text">
            {fieldErrors.consent}
          </p>
        ) : null}

        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="interviewOptIn"
            checked={values.interviewOptIn}
            onChange={(e) => onChange({ interviewOptIn: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand-fill"
          />
          <span>{t.interview}</span>
        </label>
      </div>

      <Button type="submit" size="lg" loading={pending} className="h-[52px] w-full">
        {pending ? t.sending : t.submit}
      </Button>
      <p id="waitlist-note" className="text-sm text-ink-muted">
        {t.disclaimer}
      </p>
    </form>
  );
}

/** The landing's single conversion. Values survive an error response. */
export function WaitlistForm({ locale = 'es' }: { locale?: WaitlistLocale }) {
  const [result, formAction, pending] = useActionState(joinWaitlist, null);
  const [values, setValues] = useState<WaitlistValues>(EMPTY);
  return (
    <WaitlistFormView
      locale={locale}
      result={result}
      pending={pending}
      values={values}
      onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
      formAction={formAction}
    />
  );
}
