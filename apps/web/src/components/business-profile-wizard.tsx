'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Field, SelectField } from '@fondealo/ui';
import {
  B2B_SHARE_BANDS,
  CASH_FLOW_TYPES,
  FINANCING_USES_BY_CASH_FLOW,
  PREFERRED_TERM_BANDS,
  REQUESTED_AMOUNT_BANDS,
  type CashFlowType,
  type FinancingUseCase,
} from '@fondealo/types';
import { businessProfileInputSchema, type BusinessProfileInitial } from '@/lib/business-profile';
import {
  KYB_COUNTRIES,
  SECTORS,
  SECTOR_LABELS,
  REVENUE_BANDS,
  REVENUE_BAND_LABELS,
} from '@/lib/providers/kyb';
import { saveBusinessProfile } from '@/lib/actions/business-profile';
import { useAppLocale, useAppTranslation } from './app-locale-provider';

export const CASH_FLOW_COPY = {
  B2B_RECEIVABLES: [
    'Facturo a otras empresas',
    'I invoice other businesses',
    'Vendes productos o servicios B2B y normalmente cobras tus facturas después de 30, 60 o 90 días.',
    'You sell to businesses and usually collect invoices after 30, 60 or 90 days.',
  ],
  RECURRING_REVENUE: [
    'Tengo ingresos recurrentes',
    'I have recurring revenue',
    'Tu empresa cobra suscripciones o contratos de forma periódica.',
    'Your company earns revenue from subscriptions or recurring contracts.',
  ],
  OPERATING_REVENUE: [
    'Tengo otros ingresos operativos',
    'I have other operating revenue',
    'Tu empresa ya vende regularmente, pero no encaja en las opciones anteriores.',
    'Your company sells regularly but does not fit the options above.',
  ],
  PRE_REVENUE: [
    'Todavía no generamos ingresos',
    'We are not generating revenue yet',
    'Puedes crear tu perfil empresarial. El financiamiento basado en flujo todavía no aplica a tu etapa.',
    'You can create your business profile. Cash-flow financing does not apply to your stage yet.',
  ],
} as const;
const USE_LABELS: Record<FinancingUseCase, [string, string]> = {
  INVOICE_ADVANCE: ['Adelantar facturas', 'Invoice advance'],
  WORKING_CAPITAL: ['Capital de trabajo', 'Working capital'],
  INVENTORY_OR_PO: ['Inventario / órdenes de compra', 'Inventory / purchase orders'],
  GROWTH_CAPITAL: ['Crecimiento sin ceder acciones', 'Growth without giving up equity'],
  OTHER: ['Otro', 'Other'],
};
const AMOUNT_LABELS = [
  ['Hasta US$ 10 mil', 'Up to US$10k'],
  ['US$ 10 mil – 50 mil', 'US$10k–50k'],
  ['US$ 50 mil – 100 mil', 'US$50k–100k'],
  ['Más de US$ 100 mil', 'Over US$100k'],
];
const TERM_LABELS = [
  ['Hasta 30 días', 'Up to 30 days'],
  ['31–90 días', '31–90 days'],
  ['91–180 días', '91–180 days'],
  ['Más de 180 días', 'Over 180 days'],
];
const SHARE_LABELS = [
  ['Menos de la mitad', 'Less than half'],
  ['La mitad o más', 'Half or more'],
  ['Todos', 'All'],
];
const EVIDENCE_HINTS: Record<CashFlowType, [string, string]> = {
  B2B_RECEIVABLES: [
    'Más adelante podremos pedir facturas y condiciones de cobro, además de la identidad de tu empresa.',
    'Later, we may request invoices and payment terms, alongside your company identity.',
  ],
  RECURRING_REVENUE: [
    'Más adelante podremos pedir contratos o suscripciones e historial de cobros.',
    'Later, we may request contracts or subscriptions and collection history.',
  ],
  OPERATING_REVENUE: [
    'Más adelante podremos pedir registros de ventas y actividad de la empresa.',
    'Later, we may request sales and business activity records.',
  ],
  PRE_REVENUE: [
    'Podrás completar la identidad de tu empresa. No te pedimos información para una solicitud de deuda en esta etapa.',
    'You can complete your company identity. We are not requesting information for a debt application at this stage.',
  ],
};

export function BusinessProfileWizard({ initial }: { initial: BusinessProfileInitial | null }) {
  const locale = useAppLocale();
  const t = useAppTranslation();
  const index = locale === 'es' ? 0 : 1;
  const router = useRouter();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [details, setDetails] = useState({
    legalName: initial?.legalName ?? '',
    country: initial?.country ?? 'Peru',
    sector: initial?.sector ?? '',
    foundedYear: String(initial?.foundedYear ?? ''),
    revenueBand: initial?.revenueBand ?? '',
  });
  const [cashFlow, setCashFlow] = useState<CashFlowType | ''>(
    initial?.profile?.primaryCashFlowType ?? '',
  );
  const [useCase, setUseCase] = useState<FinancingUseCase | ''>(
    initial?.profile?.financingUseCase ?? '',
  );
  const [amount, setAmount] = useState(initial?.profile?.requestedAmountBand ?? '');
  const [term, setTerm] = useState(initial?.profile?.preferredTermBand ?? '');
  const [share, setShare] = useState(initial?.profile?.b2bShareBand ?? '');
  const preRevenue = cashFlow === 'PRE_REVENUE';
  const selectedCountry = KYB_COUNTRIES.find((country) => country.name === details.country);
  const steps =
    locale === 'es'
      ? ['Tu empresa', 'Tus ingresos', 'Qué quieres financiar', 'Perfil inicial', 'Resumen']
      : ['Your company', 'Your revenue', 'Financing purpose', 'Initial profile', 'Summary'];
  const update = (key: keyof typeof details, value: string) =>
    setDetails((d) => ({ ...d, [key]: value }));
  function go(next: number) {
    setError('');
    setStep(next);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }
  function submit() {
    if (step < 4) {
      go(step + 1);
      return;
    }
    const parsed = businessProfileInputSchema.safeParse({
      ...details,
      foundedYear: Number(details.foundedYear),
      revenueBand: preRevenue && !initial?.identityLocked ? null : details.revenueBand || null,
      profile: {
        primaryCashFlowType: cashFlow,
        financingUseCase: preRevenue ? null : useCase,
        requestedAmountBand: preRevenue ? null : amount,
        preferredTermBand: preRevenue ? null : term,
        b2bShareBand: share || null,
      },
    });
    if (!parsed.success) {
      setError(t('Review your company details and complete the required ranges.'));
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveBusinessProfile(parsed.data);
        if (!result.ok) {
          setError(result.error);
          window.requestAnimationFrame(() => errorRef.current?.focus());
          return;
        }
        router.push('/business');
        router.refresh();
      } catch {
        setError(
          t('We could not save your profile. Please try again; your account access is unchanged.'),
        );
      }
    });
  }
  return (
    <Card className="mx-auto max-w-2xl p-5 sm:p-8">
      <nav aria-label={locale === 'es' ? 'Progreso del perfil' : 'Profile progress'}>
        <ol className="mb-6 grid grid-cols-5 gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              aria-current={step === i ? 'step' : undefined}
              className={`border-t-4 pt-2 text-sm ${i <= step ? 'border-brand-fill text-ink' : 'border-line text-ink-muted'}`}
            >
              <span className="block font-semibold">{i + 1}</span>
              <span className="hidden sm:block">{label}</span>
            </li>
          ))}
        </ol>
      </nav>
      <p className="text-sm text-ink-muted">
        {locale === 'es' ? `Paso ${step + 1} de 5` : `Step ${step + 1} of 5`}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-6 mt-2 text-2xl font-semibold text-ink focus:outline-none"
      >
        {steps[step]}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        aria-busy={pending}
        className="space-y-5"
      >
        <fieldset disabled={pending} className="m-0 min-w-0 space-y-5 border-0 p-0">
          {step === 0 ? (
            <>
              {initial?.identityLocked ? (
                <p className="rounded-xl bg-surface-100 p-3 text-sm text-ink-muted">
                  {locale === 'es'
                    ? 'Los datos ya enviados a verificación se conservan. Para corregirlos, contacta a soporte.'
                    : 'Details already submitted for verification are preserved. Contact support to correct them.'}
                </p>
              ) : null}
              <Field
                label={locale === 'es' ? 'Razón social' : 'Legal name'}
                required
                minLength={2}
                maxLength={120}
                autoComplete="organization"
                disabled={initial?.identityLocked}
                value={details.legalName}
                onChange={(e) => update('legalName', e.target.value)}
              />
              <SelectField
                label={locale === 'es' ? 'País de constitución' : 'Country of incorporation'}
                required
                disabled={initial?.identityLocked}
                value={details.country}
                onChange={(e) => update('country', e.target.value)}
              >
                {KYB_COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {locale === 'es' ? c.label : c.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label={locale === 'es' ? 'Sector' : 'Sector'}
                required
                disabled={initial?.identityLocked && Boolean(initial.sector)}
                value={details.sector}
                onChange={(e) => update('sector', e.target.value)}
              >
                <option value="">{t('Choose an option')}</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {locale === 'es' ? SECTOR_LABELS[s] : s}
                  </option>
                ))}
              </SelectField>
              <Field
                label={locale === 'es' ? 'Año de fundación' : 'Year founded'}
                type="number"
                required
                min={1900}
                max={new Date().getFullYear()}
                disabled={initial?.identityLocked && Boolean(initial.foundedYear)}
                value={details.foundedYear}
                onChange={(e) => update('foundedYear', e.target.value)}
              />
            </>
          ) : null}
          {step === 1 ? (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-base font-medium text-ink">
                {locale === 'es'
                  ? '¿Cómo genera ingresos tu empresa?'
                  : 'How does your company earn revenue?'}
              </legend>
              {CASH_FLOW_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${cashFlow === type ? 'border-brand-fill bg-brand-soft' : 'border-line bg-surface-100'}`}
                >
                  <input
                    type="radio"
                    name="cashFlow"
                    required
                    value={type}
                    checked={cashFlow === type}
                    onChange={() => {
                      setCashFlow(type);
                      setUseCase('');
                      setAmount('');
                      setTerm('');
                      setShare('');
                    }}
                    className="mt-1 h-5 w-5 accent-brand-fill"
                  />
                  <span>
                    <span className="block font-semibold text-ink">
                      {CASH_FLOW_COPY[type][index]}
                    </span>
                    <span className="mt-1 block text-sm text-ink-muted">
                      {CASH_FLOW_COPY[type][index + 2]}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
          {step === 2 ? (
            preRevenue ? (
              <p className="rounded-xl bg-surface-100 p-5 text-ink">
                {locale === 'es'
                  ? 'La propuesta de financiamiento que estamos preparando está dirigida a empresas con flujos operativos verificables. Puedes continuar con tu perfil empresarial sin solicitar deuda.'
                  : 'The financing product we are preparing is designed for businesses with verifiable operating cash flows. You can continue with your business profile without requesting debt.'}
              </p>
            ) : (
              <SelectField
                label={
                  locale === 'es' ? '¿Qué quieres financiar?' : 'What would you like to finance?'
                }
                required
                value={useCase}
                onChange={(e) => setUseCase(e.target.value as FinancingUseCase)}
              >
                <option value="">{t('Choose an option')}</option>
                {cashFlow
                  ? FINANCING_USES_BY_CASH_FLOW[cashFlow].map((value) => (
                      <option key={value} value={value}>
                        {USE_LABELS[value][index]}
                      </option>
                    ))
                  : null}
              </SelectField>
            )
          ) : null}
          {step === 3 ? (
            preRevenue ? (
              <p className="text-ink-muted">
                {locale === 'es'
                  ? 'No te pediremos montos ni plazos de financiamiento en esta etapa. Tampoco necesitas subir documentos.'
                  : 'We won’t ask for financing amounts or terms at this stage. You don’t need to upload documents either.'}
              </p>
            ) : (
              <>
                <p className="text-sm text-ink-muted">
                  {locale === 'es'
                    ? 'Solo rangos en dólares. No necesitas documentos ni saldos bancarios.'
                    : 'US dollar ranges only. No documents or bank balances needed.'}
                </p>
                <SelectField
                  label={locale === 'es' ? 'Ingresos mensuales' : 'Monthly revenue'}
                  required
                  disabled={initial?.identityLocked && Boolean(initial.revenueBand)}
                  value={details.revenueBand}
                  onChange={(e) => update('revenueBand', e.target.value)}
                >
                  <option value="">{t('Choose an option')}</option>
                  {REVENUE_BANDS.map((band) => (
                    <option key={band} value={band}>
                      {locale === 'es' ? REVENUE_BAND_LABELS[band] : band}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label={locale === 'es' ? 'Monto que buscas (USD)' : 'Requested amount (USD)'}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                >
                  <option value="">{t('Choose an option')}</option>
                  {REQUESTED_AMOUNT_BANDS.map((v, i) => (
                    <option key={v} value={v}>
                      {AMOUNT_LABELS[i]![index]}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label={locale === 'es' ? 'Plazo preferido' : 'Preferred term'}
                  required
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                >
                  <option value="">{t('Choose an option')}</option>
                  {PREFERRED_TERM_BANDS.map((v, i) => (
                    <option key={v} value={v}>
                      {TERM_LABELS[i]![index]}
                    </option>
                  ))}
                </SelectField>
                {cashFlow === 'B2B_RECEIVABLES' ? (
                  <SelectField
                    label={
                      locale === 'es'
                        ? 'Ventas a empresas (opcional)'
                        : 'Sales to businesses (optional)'
                    }
                    value={share}
                    onChange={(e) => setShare(e.target.value)}
                  >
                    <option value="">
                      {locale === 'es' ? 'Prefiero no indicar' : 'Prefer not to say'}
                    </option>
                    {B2B_SHARE_BANDS.map((v, i) => (
                      <option key={v} value={v}>
                        {SHARE_LABELS[i]![index]}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
              </>
            )
          ) : null}
          {step === 4 ? (
            <>
              <dl className="space-y-3 rounded-xl bg-surface-100 p-5 text-ink">
                <div>
                  <dt className="text-sm text-ink-muted">
                    {locale === 'es' ? 'Empresa' : 'Company'}
                  </dt>
                  <dd className="font-semibold">
                    {details.legalName} ·{' '}
                    {locale === 'es'
                      ? (selectedCountry?.label ?? details.country)
                      : details.country}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-ink-muted">
                    {locale === 'es' ? 'Ingresos' : 'Revenue'}
                  </dt>
                  <dd>{cashFlow ? CASH_FLOW_COPY[cashFlow][index] : '—'}</dd>
                </div>
                {!preRevenue && useCase ? (
                  <>
                    <div>
                      <dt className="text-sm text-ink-muted">
                        {locale === 'es' ? 'Uso del financiamiento' : 'Financing purpose'}
                      </dt>
                      <dd>{USE_LABELS[useCase][index]}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-ink-muted">
                        {locale === 'es' ? 'Monto y plazo' : 'Amount and term'}
                      </dt>
                      <dd>
                        {
                          AMOUNT_LABELS[
                            REQUESTED_AMOUNT_BANDS.indexOf(
                              amount as (typeof REQUESTED_AMOUNT_BANDS)[number],
                            )
                          ]?.[index]
                        }{' '}
                        ·{' '}
                        {
                          TERM_LABELS[
                            PREFERRED_TERM_BANDS.indexOf(
                              term as (typeof PREFERRED_TERM_BANDS)[number],
                            )
                          ]?.[index]
                        }
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
              <p className="font-medium text-ink">
                {locale === 'es'
                  ? 'Este perfil nos ayuda a saber qué evidencia necesita tu empresa.'
                  : 'This profile helps us understand which evidence your company will need.'}
              </p>
              {cashFlow ? (
                <div className="rounded-xl bg-surface-100 p-4 text-sm text-ink-muted">
                  <h3 className="mb-2 font-semibold text-ink">
                    {locale === 'es' ? 'Tus próximos pasos' : 'Your next steps'}
                  </h3>
                  <p>{EVIDENCE_HINTS[cashFlow][index]}</p>
                  <p className="mt-2">
                    {locale === 'es'
                      ? 'No subas documentos ahora. Los requisitos finales dependerán de la revisión.'
                      : 'Do not upload documents now. Final requirements will depend on review.'}
                  </p>
                </div>
              ) : null}
              <p className="text-sm text-ink-muted">
                {locale === 'es'
                  ? 'Fondealo utiliza estos datos para preparar tu proceso de verificación y evaluación. Completar este perfil no constituye una aprobación de crédito ni garantiza financiamiento.'
                  : 'Fondealo uses these details to prepare verification and assessment. Completing this profile is not credit approval and does not guarantee financing.'}
              </p>
            </>
          ) : null}
          {error ? (
            <p
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="rounded-lg bg-danger-soft p-3 text-sm text-danger-text"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            {step > 0 ? (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => go(step - 1)}
              >
                {locale === 'es' ? 'Atrás' : 'Back'}
              </Button>
            ) : (
              <a href="/business" className="text-sm text-brand-text underline">
                {locale === 'es' ? 'Volver a mi empresa' : 'Back to my company'}
              </a>
            )}
            <Button type="submit" loading={pending}>
              {step === 4
                ? preRevenue
                  ? locale === 'es'
                    ? 'Crear mi perfil empresarial'
                    : 'Create my business profile'
                  : locale === 'es'
                    ? 'Continuar con mi empresa'
                    : 'Continue to my company'
                : locale === 'es'
                  ? 'Continuar'
                  : 'Continue'}
            </Button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}
