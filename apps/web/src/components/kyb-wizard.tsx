'use client';

import { useActionState, useEffect, useState } from 'react';
import { Badge, Button, Card, Field, SelectField } from '@fondealo/ui';
import { submitKyb, type KybResult } from '@/lib/actions/kyb';
import {
  KYB_COUNTRIES,
  KYB_DOCUMENTS,
  KYB_VERIFIERS,
  REVENUE_BANDS,
  SECTORS,
  findCountry,
  normalizeTaxId,
} from '@/lib/providers/kyb';
import { Check, ShieldCheck } from './icons';

const STEPS = ['Business', 'Verifier', 'Documents', 'Review'] as const;
const PROGRESS_LABELS = [
  'Checking your tax ID format',
  'Screening the business (simulated)',
  'Issuing your Business Passport',
];

interface Draft {
  legalName: string;
  country: string;
  taxId: string;
  sector: string;
  foundedYear: string;
  revenueBand: string;
  email: string;
  verifierId: string;
  docs: string[];
  accept: boolean;
}

const EMPTY: Draft = {
  legalName: '',
  country: '',
  taxId: '',
  sector: '',
  foundedYear: '',
  revenueBand: '',
  email: '',
  verifierId: 'sandbox',
  docs: [],
  accept: false,
};

const initialState: KybResult | null = null;

/**
 * Four-step business registration (KYB). The verifier is a sandbox: it checks
 * formats and returns a deterministic decision, so every path is testable
 * without real documents. The catalog also lists the planned verifier network
 * (docs/strategy/verifier-network.md) so the flow is already shaped for it.
 */
export function KybWizard({
  initial,
  previouslyRejected = false,
}: {
  initial?: Partial<Draft>;
  previouslyRejected?: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitKyb, initialState);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ ...EMPTY, ...initial });
  const [stepError, setStepError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const country = findCountry(draft.country);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

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
      if (draft.legalName.trim().length < 2) return 'Enter the legal name of your business.';
      if (!country) return 'Select the country where the business is registered.';
      if (!country.pattern.test(normalizeTaxId(draft.taxId))) {
        return `Enter a valid ${country.taxIdLabel} (${country.taxIdHint}).`;
      }
      if (!draft.sector) return 'Select your sector.';
      const year = Number(draft.foundedYear);
      if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear()) {
        return 'Enter a valid founding year.';
      }
      if (!draft.revenueBand) return 'Select your monthly revenue range.';
      if (!/^\S+@\S+\.\S+$/.test(draft.email)) return 'Enter a valid contact email.';
    }
    if (current === 2) {
      if (draft.docs.length < KYB_DOCUMENTS.length) return 'Confirm every document to continue.';
      if (!draft.accept) return 'Accept the declaration to continue.';
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

  if (state?.ok && state.accepted) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldCheck width={26} height={26} />
        </span>
        <h2 className="mt-4 font-display text-2xl font-bold text-slate-900">
          {draft.legalName} is verified
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Your Business Passport has been issued at a starting score of 500. Repay on time to grow
          it and unlock cheaper capital.
        </p>
        <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left text-xs text-slate-500">
          {state.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <Check width={14} height={14} className="mt-0.5 shrink-0 text-brand-500" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-4 font-mono text-[11px] text-slate-400">Reference {state.providerRef}</p>
        <a href="/business">
          <Button className="mt-6">Go to my dashboard</Button>
        </a>
      </Card>
    );
  }

  const rejected = state?.ok && !state.accepted ? state : null;

  return (
    <div className="mx-auto max-w-2xl">
      {previouslyRejected && !state ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your previous verification was rejected. Correct your details and submit again.
        </p>
      ) : null}

      <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                i < step
                  ? 'bg-brand-600 text-white'
                  : i === step
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-200 text-slate-500',
              ].join(' ')}
            >
              {i < step ? <Check width={12} height={12} /> : i + 1}
            </span>
            <span className={i === step ? 'text-slate-900' : 'text-slate-400'}>{label}</span>
            {i < STEPS.length - 1 ? (
              <span className="h-px flex-1 bg-slate-200" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      <Card className="p-6">
        <form action={formAction} className="space-y-5">
          {/* Every step's values travel in hidden inputs so the final submit has the full draft. */}
          <input type="hidden" name="legalName" value={draft.legalName} />
          <input type="hidden" name="country" value={draft.country} />
          <input type="hidden" name="taxId" value={draft.taxId} />
          <input type="hidden" name="sector" value={draft.sector} />
          <input type="hidden" name="foundedYear" value={draft.foundedYear} />
          <input type="hidden" name="revenueBand" value={draft.revenueBand} />
          <input type="hidden" name="email" value={draft.email} />
          <input type="hidden" name="verifierId" value={draft.verifierId} />
          {draft.docs.map((d) => (
            <input key={d} type="hidden" name="docs" value={d} />
          ))}
          {draft.accept ? <input type="hidden" name="accept" value="on" /> : null}

          {step === 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Tell us about your business</h2>
              <Field
                label="Legal name"
                value={draft.legalName}
                onChange={(e) => set('legalName', e.target.value)}
                placeholder="Café Andino SAC"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Country of registration"
                  value={draft.country}
                  onChange={(e) => set('country', e.target.value)}
                >
                  <option value="">Select…</option>
                  {KYB_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label={country ? `${country.taxIdLabel} (tax ID)` : 'Tax ID'}
                  value={draft.taxId}
                  onChange={(e) => set('taxId', e.target.value)}
                  placeholder={country?.taxIdExample ?? 'Select a country first'}
                  hint={
                    country ? (
                      <>
                        {country.taxIdHint}.{' '}
                        <button
                          type="button"
                          className="font-medium text-brand-600 hover:underline"
                          onClick={() => set('taxId', country.taxIdExample)}
                        >
                          Use a test value
                        </button>
                      </>
                    ) : undefined
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Sector"
                  value={draft.sector}
                  onChange={(e) => set('sector', e.target.value)}
                >
                  <option value="">Select…</option>
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label="Year founded"
                  type="number"
                  value={draft.foundedYear}
                  onChange={(e) => set('foundedYear', e.target.value)}
                  placeholder="2019"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Monthly revenue"
                  value={draft.revenueBand}
                  onChange={(e) => set('revenueBand', e.target.value)}
                >
                  <option value="">Select…</option>
                  {REVENUE_BANDS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label="Contact email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="finance@yourbusiness.com"
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Choose a verifier</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Verifiers check that your business is real. More will join the network; today the
                  sandbox lets you test the full flow.
                </p>
              </div>
              <div className="space-y-2">
                {KYB_VERIFIERS.map((v) => {
                  const available = v.status === 'available';
                  return (
                    <label
                      key={v.id}
                      className={[
                        'flex items-start gap-3 rounded-xl border p-4 transition-colors',
                        available ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                        draft.verifierId === v.id
                          ? 'border-brand-400 bg-brand-50/60'
                          : 'border-slate-200 bg-white',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="verifier-choice"
                        className="mt-1"
                        checked={draft.verifierId === v.id}
                        disabled={!available}
                        onChange={() => set('verifierId', v.id)}
                      />
                      <span className="flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          {v.name}
                          <Badge variant={available ? 'brand' : 'neutral'}>
                            {available ? 'Available' : 'Planned'}
                          </Badge>
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">{v.description}</span>
                        <span className="mt-1 block text-[11px] text-slate-400">
                          Typical turnaround: {v.turnaround}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Sandbox rule: a tax ID ending in <code>0000</code> is rejected so you can test the
                failure path. Anything else with a valid format is accepted.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A real verifier would ask for these. In the sandbox nothing is uploaded — confirm
                  you could provide each one.
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
                          {doc.label}
                        </span>
                        <span className="block text-xs text-slate-500">{doc.help}</span>
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
                I declare the information is accurate and I am authorised to register this business.
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Review and submit</h2>
              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                {[
                  ['Legal name', draft.legalName],
                  ['Country', draft.country],
                  [country?.taxIdLabel ?? 'Tax ID', normalizeTaxId(draft.taxId)],
                  ['Sector', draft.sector],
                  ['Founded', draft.foundedYear],
                  ['Monthly revenue', draft.revenueBand],
                  ['Contact', draft.email],
                  ['Verifier', KYB_VERIFIERS.find((v) => v.id === draft.verifierId)?.name ?? ''],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="text-right font-medium text-slate-900">{v}</dd>
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
                      <span className={i > progress ? 'text-slate-400' : ''}>{label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {rejected ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="font-semibold">Verification rejected</div>
                  <ul className="mt-1 list-disc pl-5">
                    {rejected.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs">Go back, correct the details and submit again.</p>
                </div>
              ) : null}
              {state && !state.ok ? <p className="text-sm text-red-600">{state.error}</p> : null}
            </div>
          ) : null}

          {stepError ? <p className="text-sm text-red-600">{stepError}</p> : null}

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
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={pending}>
                {pending ? 'Verifying…' : 'Submit for verification'}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
