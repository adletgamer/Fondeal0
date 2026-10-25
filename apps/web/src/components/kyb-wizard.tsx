'use client';
import { useAppLocale, useAppTranslation } from './app-locale-provider';

import { useActionState, useEffect, useState } from 'react';
import { Button, Card, Field, SelectField } from '@fondealo/ui';
import { submitKyb, type KybResult } from '@/lib/actions/kyb';
import {
  KYB_COUNTRIES,
  KYB_DOCUMENTS,
  KYB_VERIFIERS,
  RELATIONSHIP_LABELS,
  REPRESENTATIVE_RELATIONSHIPS,
  REVENUE_BAND_LABELS,
  REVENUE_BANDS,
  SECTOR_LABELS,
  SECTORS,
  findCountry,
  normalizeTaxId,
} from '@/lib/providers/kyb';
import { Check, ShieldCheck } from './icons';

const STEPS = ['Tu empresa', 'Representante', 'Evidencia y consentimiento', 'Revisión'] as const;
const PROGRESS_LABELS = [
  'Revisando el formato de tu número tributario',
  'Registrando la revisión de prueba',
  'Guardando tu solicitud para revisión',
];

interface Draft {
  legalName: string;
  country: string;
  taxId: string;
  sector: string;
  foundedYear: string;
  revenueBand: string;
  email: string;
  representativeName: string;
  representativeRelationship: string;
  idempotencyKey: string;
  verifierId: string;
  docs: string[];
  accept: boolean;
  evidenceConsent: boolean;
}

const EMPTY: Draft = {
  legalName: '',
  country: '',
  taxId: '',
  sector: '',
  foundedYear: '',
  revenueBand: '',
  email: '',
  representativeName: '',
  representativeRelationship: '',
  idempotencyKey: '',
  verifierId: 'sandbox',
  docs: [],
  accept: false,
  evidenceConsent: false,
};

const initialState: KybResult | null = null;

const label = <T extends string>(labels: Record<T, string>, value: string) =>
  (labels as Record<string, string>)[value] ?? value;

/**
 * Four-step business registration (KYB). The verifier is a sandbox: it checks
 * formats without real documents. Evidence is declared, not uploaded.
 * Option values stay in English (they are stored); only labels are Spanish.
 */
export function KybWizard({
  initial,
  previouslyRejected = false,
}: {
  initial?: Partial<Draft>;
  previouslyRejected?: boolean;
}) {
  const t = useAppTranslation();
  const locale = useAppLocale();

  const [state, formAction, pending] = useActionState(submitKyb, initialState);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, ...initial });
  const [stepError, setStepError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const country = findCountry(draft.country);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  useEffect(() => {
    setDraft((d) => ({ ...d, idempotencyKey: d.idempotencyKey || crypto.randomUUID() }));
  }, []);

  // Cosmetic progress while the server action runs, so the (fast) sandbox still feels like a review.
  useEffect(() => {
    if (!pending) return;
    setProgress(0);
    const id = window.setInterval(
      () => setProgress((p) => Math.min(p + 1, PROGRESS_LABELS.length - 1)),
      1200,
    );
    return () => window.clearInterval(id);
  }, [pending]);

  function validate(current: number): string | null {
    if (current === 0) {
      if (draft.legalName.trim().length < 2) return 'Ingresa la razón social de tu empresa.';
      if (!country) return 'Selecciona el país donde está registrada la empresa.';
      if (!country.pattern.test(normalizeTaxId(draft.taxId))) {
        return `Ingresa un ${country.taxIdLabel} válido (${country.taxIdHint}).`;
      }
      if (!draft.sector) return 'Selecciona el sector de tu empresa.';
      const year = Number(draft.foundedYear);
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
        return 'Ingresa un año de fundación válido.';
      }
      if (!draft.revenueBand) return 'Selecciona tu rango de ventas mensuales.';
      if (!/^\S+@\S+\.\S+$/.test(draft.email)) return 'Ingresa un correo de contacto válido.';
    }
    if (current === 1) {
      if (draft.representativeName.trim().length < 2) return 'Ingresa el nombre del representante.';
      if (
        !(REPRESENTATIVE_RELATIONSHIPS as readonly string[]).includes(
          draft.representativeRelationship,
        )
      ) {
        return 'Selecciona tu relación con la empresa.';
      }
    }
    if (current === 2) {
      if (!draft.docs.includes('registration') || !draft.docs.includes('tax-id')) {
        return 'Confirma que cuentas con la constancia de inscripción y el documento tributario.';
      }
      if (!draft.accept) return 'Acepta la declaración para continuar.';
      if (!draft.evidenceConsent) return 'Necesitamos tu consentimiento para continuar.';
    }
    return null;
  }

  function next() {
    const err = validate(step);
    setStepError(err);
    if (!err) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function toggleDoc(id: string) {
    set('docs', draft.docs.includes(id) ? draft.docs.filter((d) => d !== id) : [...draft.docs, id]);
  }

  if (state?.ok && state.status === 'Processing') {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldCheck width={26} height={26} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">
          {t('Recibimos tu solicitud')}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {t(
            'Revisamos el formato de tus datos en modo de prueba. La verificación de tu empresa sigue pendiente y todavía no se ha emitido un Pasaporte. Verificar tu empresa no significa que recibirás financiamiento.',
          )}
        </p>
        <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left text-xs text-slate-500">
          {state.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <Check width={14} height={14} className="mt-0.5 shrink-0 text-brand-500" />
              {t(r)}
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-[11px] text-slate-400">
          {t('Referencia')} {state.providerRef}
        </p>
        <a href="/business/verify">
          <Button className="mt-6">{t('Ver el estado de mi solicitud')}</Button>
        </a>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {previouslyRejected && !state ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t('Tu solicitud anterior no fue aprobada. Corrige tus datos y envíala de nuevo.')}
        </p>
      ) : null}

      <ol
        aria-label={t('Pasos de la solicitud')}
        className="mb-6 grid grid-cols-2 gap-3 text-xs font-medium sm:flex sm:items-center"
      >
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? 'step' : undefined}
            className="flex flex-1 items-center gap-2"
          >
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                i < step
                  ? 'bg-brand-fill text-on-brand'
                  : i === step
                    ? 'bg-ink text-surface-0'
                    : 'bg-slate-200 text-slate-500',
              ].join(' ')}
            >
              {i < step ? <Check width={12} height={12} /> : i + 1}
            </span>
            <span className={i === step ? 'text-slate-900' : 'text-slate-400'}>{t(label)}</span>
            {i < STEPS.length - 1 ? (
              <span className="h-px flex-1 bg-slate-200" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="locale" value={locale} />
          {/* Every step's values travel in hidden inputs so the final submit has the full draft. */}
          <input type="hidden" name="legalName" value={draft.legalName} />
          <input type="hidden" name="country" value={draft.country} />
          <input type="hidden" name="taxId" value={draft.taxId} />
          <input type="hidden" name="sector" value={draft.sector} />
          <input type="hidden" name="foundedYear" value={draft.foundedYear} />
          <input type="hidden" name="revenueBand" value={draft.revenueBand} />
          <input type="hidden" name="email" value={draft.email} />
          <input type="hidden" name="representativeName" value={draft.representativeName} />
          <input
            type="hidden"
            name="representativeRelationship"
            value={draft.representativeRelationship}
          />
          <input type="hidden" name="idempotencyKey" value={draft.idempotencyKey} />
          <input type="hidden" name="verifierId" value={draft.verifierId} />
          {draft.docs.map((d) => (
            <input key={d} type="hidden" name="docs" value={d} />
          ))}
          {draft.accept ? <input type="hidden" name="accept" value="on" /> : null}
          {draft.evidenceConsent ? <input type="hidden" name="evidenceConsent" value="on" /> : null}

          {step === 0 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('Cuéntanos sobre tu empresa')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t(
                    'Usamos estos datos para identificar a tu empresa. Te pediremos permiso antes de compartirlos con cualquier financiador.',
                  )}
                </p>
              </div>
              <Field
                label={t('Razón social')}
                value={draft.legalName}
                onChange={(e) => set('legalName', e.target.value)}
                placeholder="Café Andino SAC"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label={t('País de registro')}
                  value={draft.country}
                  onChange={(e) => set('country', e.target.value)}
                >
                  <option value="">{t('Selecciona…')}</option>
                  {KYB_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {t(c.label)}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label={
                    country
                      ? t('{p0} (número tributario)', { p0: country.taxIdLabel })
                      : t('Número tributario')
                  }
                  value={draft.taxId}
                  onChange={(e) => set('taxId', e.target.value)}
                  placeholder={country?.taxIdExample ?? t('Select a country first')}
                  hint={
                    country ? (
                      <>
                        {t(country.taxIdHint)}.{' '}
                        <button
                          type="button"
                          className="font-medium text-brand-600 hover:underline"
                          onClick={() => set('taxId', country.taxIdExample)}
                        >
                          {t('Usar un valor de prueba')}
                        </button>
                      </>
                    ) : undefined
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label={t('Sector')}
                  value={draft.sector}
                  onChange={(e) => set('sector', e.target.value)}
                >
                  <option value="">{t('Selecciona…')}</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {t(SECTOR_LABELS[s])}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label={t('Año de fundación')}
                  type="number"
                  value={draft.foundedYear}
                  onChange={(e) => set('foundedYear', e.target.value)}
                  placeholder="2019"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label={t('Ventas mensuales (aprox.)')}
                  value={draft.revenueBand}
                  onChange={(e) => set('revenueBand', e.target.value)}
                >
                  <option value="">{t('Selecciona…')}</option>
                  {REVENUE_BANDS.map((r) => (
                    <option key={r} value={r}>
                      {t(REVENUE_BAND_LABELS[r])}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label={t('Correo de contacto')}
                  type="email"
                  value={draft.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="finanzas@tuempresa.pe"
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('Representante autorizado')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('Es la persona que puede actuar en nombre de la empresa.')}
                </p>
              </div>
              <Field
                label={t('Nombre completo')}
                value={draft.representativeName}
                onChange={(e) => set('representativeName', e.target.value)}
              />
              <SelectField
                label={t('Relación con la empresa')}
                value={draft.representativeRelationship}
                onChange={(e) => set('representativeRelationship', e.target.value)}
              >
                <option value="">{t('Selecciona…')}</option>
                {REPRESENTATIVE_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {t(RELATIONSHIP_LABELS[r])}
                  </option>
                ))}
              </SelectField>
              <p className="text-sm text-slate-500">
                {t('Esta relación es declarada por ti. En esta etapa no verificamos tus poderes.')}
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('Evidencia y consentimiento')}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t(
                    'Marca los documentos que puedes presentar. La constancia de inscripción y el documento tributario son obligatorios; los de propietarios y domicilio solo se pedirán si la revisión los necesita. No subas documentos aquí.',
                  )}
                </p>
              </div>
              <ul className="space-y-2">
                {KYB_DOCUMENTS.map((doc) => (
                  <li key={doc.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={draft.docs.includes(doc.id)}
                        onChange={() => toggleDoc(doc.id)}
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">
                          {t(doc.label)}
                        </span>
                        <span className="block text-xs text-slate-500">{t(doc.help)}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.accept}
                  onChange={(e) => set('accept', e.target.checked)}
                />
                {t(
                  'Declaro que la información es correcta y que estoy autorizado para registrar esta empresa.',
                )}
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={draft.evidenceConsent}
                  onChange={(e) => set('evidenceConsent', e.target.checked)}
                />
                {t(
                  'Autorizo a Fondealo a guardar esta solicitud y mis declaraciones de evidencia para verificar mi empresa (política de solicitud v1). No compartimos estos datos con financiadores sin pedirte permiso. En este modo de prueba no se suben documentos.',
                )}{' '}
                <a href="/business/datos" className="font-medium text-brand-600 hover:underline">
                  {t('Qué datos guardamos')}
                </a>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{t('Revisa y envía')}</h2>
              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                {[
                  ['Razón social', draft.legalName],
                  ['País', country?.label ?? draft.country],
                  [country?.taxIdLabel ?? 'Número tributario', normalizeTaxId(draft.taxId)],
                  ['Sector', label(SECTOR_LABELS, draft.sector)],
                  ['Fundación', draft.foundedYear],
                  ['Ventas mensuales', label(REVENUE_BAND_LABELS, draft.revenueBand)],
                  ['Contacto', draft.email],
                  ['Representante', draft.representativeName],
                  ['Relación', label(RELATIONSHIP_LABELS, draft.representativeRelationship)],
                  ['Verificador', KYB_VERIFIERS.find((v) => v.id === draft.verifierId)?.name ?? ''],
                ].map(([k = '', v = '']) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-slate-500">{t(k)}</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {['Sector', 'Ventas mensuales', 'Relación', 'Verificador', 'País'].includes(k)
                        ? t(v)
                        : v}
                    </dd>
                  </div>
                ))}
              </dl>

              {pending ? (
                <ul className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                  {PROGRESS_LABELS.map((label, i) => (
                    <li key={label} className="flex items-center gap-2.5 text-slate-600">
                      {i < progress ? (
                        <Check width={15} height={15} className="text-brand-600" />
                      ) : (
                        <span
                          className={`h-3.5 w-3.5 rounded-full border-2 ${
                            i === progress
                              ? 'animate-spin border-brand-300 border-t-brand-600'
                              : 'border-slate-200'
                          }`}
                        />
                      )}
                      <span className={i > progress ? 'text-slate-400' : ''}>{t(label)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {state && !state.ok ? (
                <p role="alert" className="text-sm text-red-600">
                  {t.error(state.error)}
                </p>
              ) : null}
            </div>
          ) : null}

          {stepError ? (
            <p role="alert" className="text-sm text-red-600">
              {t.error(stepError)}
            </p>
          ) : null}

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || pending}
              onClick={() => {
                setStepError(null);
                setStep((s) => Math.max(0, s - 1));
              }}
            >
              {t('Atrás')}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                {t('Continuar')}
              </Button>
            ) : (
              <Button type="submit" disabled={pending || !draft.idempotencyKey}>
                {pending ? t('Enviando…') : t('Enviar para revisión')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
