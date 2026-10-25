import { getAppTranslator } from '@/lib/app-locale';
import { redirect } from 'next/navigation';
import { Badge, Card, Container } from '@fondealo/ui';
import { COLLATERAL_CONFIG_V1, RiskBand, requiredCollateral } from '@fondealo/types';
import { ApplicationStatusCard } from '@/components/application-status-card';
import { DataSourceBadge } from '@/components/data-source-badge';
import { PassportV2 } from '@/components/passport-v2';
import { getBorrowerPassport, getBusinessOpportunities } from '@/lib/data/opportunities';
import { getSession } from '@/lib/auth/session';
import { getKybState } from '@/lib/data/kyb';
import { applicationStatus } from '@/lib/application-status';
import { formatDateLima } from '@/lib/format';
import { getPassportTheme } from '@/lib/data/passport-theme';
import { getWalletSummary } from '@/lib/wallet/ledger';
import { BalanceCard } from '@/components/balance-card';
import { Calendar, Coins, Plus, ShieldCheck } from '@/components/icons';
import { getBusinessOnboardingState } from '@/lib/data/business-onboarding';
import { getAppLocale } from '@/lib/app-locale';

const BAND_ORDER = Object.values(RiskBand);
const ACTIVE_STATUSES = new Set(['Open', 'Funded', 'Active']);
const STATUS_LABEL: Record<string, string> = {
  Draft: 'Borrador',
  Open: 'Abierta',
  Funded: 'Financiada',
  Active: 'Activa',
  Repaid: 'Pagada',
  Defaulted: 'En mora',
  Cancelled: 'Cancelada',
};

export const dynamic = 'force-dynamic';

export default async function BusinessDashboard() {
  // Pages validate before querying because layouts and pages can render in
  // parallel; a layout redirect alone cannot protect server-rendered data.
  const session = await getSession();
  if (!session?.stellarAddress) redirect('/onboarding');
  if (session.role !== 'Business')
    redirect(session.role === 'Investor' ? '/invest' : '/onboarding');
  const t = await getAppTranslator();

  const address = session.stellarAddress;
  const [onboarding, locale] = await Promise.all([
    getBusinessOnboardingState(session),
    getAppLocale(),
  ]);
  const kyb = await getKybState(address);
  const eligible = kyb?.eligible === true;
  const [wallet, theme] = await Promise.all([
    getWalletSummary(address),
    eligible ? getPassportTheme(address) : Promise.resolve(null),
  ]);
  const holder = kyb?.legalName
    ? { name: kyb.legalName, place: [kyb.country, kyb.sector].filter(Boolean).join(' · ') }
    : undefined;

  const [{ source: passportSource, passport }, { source: loansSource, opportunities }] =
    await Promise.all([getBorrowerPassport(address), getBusinessOpportunities(address)]);

  const activeLoans = opportunities.filter((o) => ACTIVE_STATUSES.has(o.status));
  // Money and credit tiles only make sense once there is something to show:
  // a verified business, or obligations that already exist.
  const hasObligations = opportunities.length > 0;
  const totalCollateralLocked = activeLoans.reduce(
    (sum, o) => sum + Number(requiredCollateral(o.amount, o.riskBand)),
    0,
  );
  const nextDue = activeLoans
    .filter((o) => o.status === 'Funded' || o.status === 'Active')
    .map((o) => ({ opportunity: o, dueAt: o.createdAt + o.termDays * 86_400 }))
    .sort((a, b) => a.dueAt - b.dueAt)[0];

  const currentRatioBps = eligible
    ? COLLATERAL_CONFIG_V1[passport.riskBand].collateralRatioBps
    : null;
  const bandIndex = BAND_ORDER.indexOf(passport.riskBand);
  const nextBand = bandIndex > 0 ? BAND_ORDER[bandIndex - 1] : null;
  const nextRatioBps = nextBand ? COLLATERAL_CONFIG_V1[nextBand].collateralRatioBps : null;

  return (
    <>
      <main className="bg-slate-50 pb-20">
        <Container className="py-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-900">
                {kyb?.legalName ?? onboarding.initial?.legalName ?? t('Tu empresa')}
              </h1>
              <p className="mt-1 text-slate-600">
                {t('El estado de tu verificación y tus solicitudes.')}
              </p>
            </div>
            <div className="flex gap-2">
              {eligible || hasObligations ? (
                <DataSourceBadge source={loansSource === 'demo' ? loansSource : passportSource} />
              ) : null}
              {eligible ? (
                <a href="/business/new">
                  <Badge variant="brand">
                    <Plus width={12} height={12} /> {t('Nueva solicitud')}
                  </Badge>
                </a>
              ) : null}
            </div>
          </div>

          <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="max-w-2xl">
              <h2 className="font-semibold text-ink">
                {locale === 'es'
                  ? onboarding.kind === 'PROFILE_COMPLETE' || onboarding.kind === 'PRE_REVENUE'
                    ? 'Tu perfil financiero'
                    : 'Completa tu perfil de financiamiento'
                  : onboarding.kind === 'PROFILE_COMPLETE' || onboarding.kind === 'PRE_REVENUE'
                    ? 'Your financial profile'
                    : 'Complete your financing profile'}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {onboarding.kind === 'UNAVAILABLE'
                  ? locale === 'es'
                    ? 'Tu perfil no está disponible por ahora. Puedes seguir usando tu panel.'
                    : 'Your profile is temporarily unavailable. You can keep using your dashboard.'
                  : onboarding.kind === 'PRE_REVENUE'
                    ? locale === 'es'
                      ? 'Perfil empresarial guardado. La propuesta de financiamiento que estamos preparando requiere flujos operativos verificables.'
                      : 'Business profile saved. The financing product we are preparing requires verifiable operating cash flows.'
                    : locale === 'es'
                      ? 'Este perfil orienta la evidencia que necesitaremos. No constituye una verificación ni una aprobación de crédito.'
                      : 'This profile guides the evidence we’ll need. It is not verification or credit approval.'}
              </p>
            </div>
            <a
              href="/business/onboarding"
              className="shrink-0 rounded-xl bg-brand-fill px-4 py-3 text-sm font-semibold text-on-brand"
            >
              {locale === 'es'
                ? onboarding.kind === 'PROFILE_COMPLETE' || onboarding.kind === 'PRE_REVENUE'
                  ? 'Ver perfil'
                  : 'Completar perfil'
                : onboarding.kind === 'PROFILE_COMPLETE' || onboarding.kind === 'PRE_REVENUE'
                  ? 'View profile'
                  : 'Complete profile'}
            </a>
          </Card>

          {!eligible ? (
            <ApplicationStatusCard status={applicationStatus(kyb)} compact className="mb-6" />
          ) : null}

          {eligible || hasObligations ? <BalanceCard summary={wallet} className="mb-6" /> : null}

          <div className={eligible ? 'grid gap-6 lg:grid-cols-[380px_1fr]' : 'grid gap-6'}>
            {eligible && theme ? (
              <PassportV2
                passport={passport}
                theme={theme}
                holder={holder}
                explorerUrl={
                  passportSource === 'chain'
                    ? `https://stellar.expert/explorer/testnet/account/${passport.business}`
                    : undefined
                }
              />
            ) : null}

            {eligible || hasObligations ? (
              <div className="grid content-start gap-6">
                <div className={`grid gap-4 ${eligible ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Coins width={16} height={16} />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {t('Garantía bloqueada')}
                      </span>
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold text-slate-900">
                      {totalCollateralLocked.toLocaleString(t('__locale'))} USDC
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar width={16} height={16} />
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {t('Próximo pago')}
                      </span>
                    </div>
                    <div className="mt-2 font-display text-2xl font-bold text-slate-900">
                      {nextDue
                        ? formatDateLima(nextDue.dueAt * 1000, 'medium', t('__locale'))
                        : '—'}
                    </div>
                  </Card>
                  {eligible && currentRatioBps !== null ? (
                    <Card className="p-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldCheck width={16} height={16} />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {t('Garantía requerida')}
                        </span>
                      </div>
                      <div className="mt-2 font-display text-2xl font-bold text-slate-900">
                        {currentRatioBps / 100}
                        {t('% del monto')}
                      </div>
                      {nextBand && nextRatioBps !== null ? (
                        <p className="mt-1 text-xs text-slate-600">
                          {t('En la banda')} {nextBand} {t('sería')} {nextRatioBps / 100}%.
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-emerald-600">
                          {t('Ya estás en la mejor banda.')}
                        </p>
                      )}
                    </Card>
                  ) : null}
                </div>

                <Card className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">{t('Tus solicitudes')}</h2>
                    {eligible ? (
                      <a
                        href="/business/new"
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        {t('+ Nueva solicitud')}
                      </a>
                    ) : null}
                  </div>
                  {opportunities.length === 0 ? (
                    <p className="text-sm text-slate-600">{t('Aún no tienes solicitudes.')}</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {opportunities.map((o) => (
                        <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <a
                              href={`/business/loans/${o.id}`}
                              className="truncate text-sm font-medium text-slate-800 hover:text-brand-700 hover:underline"
                            >
                              {o.title}
                            </a>
                            <div className="text-xs text-slate-500">
                              {Number(o.funded).toLocaleString(t('__locale'))} /{' '}
                              {Number(o.amount).toLocaleString(t('__locale'))} {t('USDC &nbsp;·')}{' '}
                              {o.termDays} {t('días ·')}{' '}
                              {(o.aprBps / 100).toLocaleString(t('__locale'), {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })}
                              {t('% anual')}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {t(STATUS_LABEL[o.status] ?? o.status)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            ) : null}
          </div>
        </Container>
      </main>
    </>
  );
}
