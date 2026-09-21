import Link from 'next/link';
import { Badge, Button, Container } from '@fondealo/ui';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PassportShowcase } from '@/components/passport-showcase';
import { ReputationSimulator } from '@/components/reputation-simulator';
import { LayerExplainer } from '@/components/layer-explainer';
import { ReputationRing } from '@/components/reputation-ring';
import { SHOWCASE_PASSPORT } from '@/lib/showcase';
import { ArrowRight, Check, Lock, Sparkle } from '@/components/icons';

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Composability />
        <HowItWorks />
        <TwoLayers />
        <ReputationSection />
        <Audiences />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------- Hero ------------------------------- */
const PROOF = [
  { title: '3 Soroban contracts', body: 'Passport · Score · Escrow' },
  { title: 'Non-custodial', body: 'Your wallet, your keys' },
  { title: 'PII stays off-chain', body: 'Only a hash goes on-chain' },
  { title: 'Stellar · USDC', body: 'Protocol 27 settlement' },
];

function Hero() {
  return (
    <section className="relative overflow-hidden bg-night-950 text-white">
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-60" aria-hidden />
      <div className="absolute inset-0 bg-radial-brand" aria-hidden />
      <Container className="relative grid items-center gap-14 pb-16 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pb-20 lg:pt-20">
        <div className="animate-fade-up">
          <Badge variant="outline" className="mb-7">
            <Sparkle width={14} height={14} className="text-brand-300" />
            Stellar · Soroban · USDC
          </Badge>
          <h1 className="font-serif text-[2.6rem] font-medium leading-[1.03] tracking-tight sm:text-6xl lg:text-[4.35rem]">
            <em className="text-gradient pr-1 italic">Portable credit infrastructure</em> for Latin
            American businesses.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300">
            Every SME gets one{' '}
            <strong className="font-semibold text-white">Business Passport</strong> — a
            non-transferable credential and a credit reputation that grows with each repayment, and
            follows the business from loan to loan.
          </p>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            Infraestructura de crédito para PyMEs latinoamericanas, sobre Stellar.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/onboarding?intent=business">
              <Button size="lg">
                Get your Business Passport
                <ArrowRight width={18} height={18} />
              </Button>
            </Link>
            <Link href="/onboarding?intent=invest">
              <Button variant="ghost-light" size="lg">
                Fund opportunities in USDC
              </Button>
            </Link>
          </div>
        </div>

        <div className="animate-fade-up lg:justify-self-end">
          <PassportShowcase />
        </div>
      </Container>

      <Container className="relative pb-2">
        <ul className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
          {PROOF.map(({ title, body }) => (
            <li key={title} className="px-1 py-5 lg:px-6 lg:first:pl-0">
              <span className="block font-display text-[15px] font-semibold text-white">
                {title}
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">{body}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* --------------------------- Composability -------------------------- */
function Composability() {
  const legos = [
    ['Blend', 'lending'],
    ['Reflector', 'oracle'],
    ['DeFindex', 'yield'],
    ['USDC', 'settlement'],
  ];
  return (
    <section id="compose" className="scroll-mt-20 border-b border-slate-200 bg-white">
      <Container className="flex flex-wrap items-center justify-between gap-x-12 gap-y-4 py-7">
        <p className="max-w-sm text-sm leading-relaxed text-slate-600">
          We don&apos;t rebuild lending. We compose the Stellar money-legos and own the credit
          layer.
        </p>
        <ul className="flex flex-wrap items-baseline gap-x-9 gap-y-2">
          {legos.map(([name, role]) => (
            <li key={name} className="font-display text-xl font-semibold text-slate-800">
              {name}
              <span className="ml-1.5 text-xs font-normal uppercase tracking-wider text-slate-500">
                {role}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* --------------------------- How it works --------------------------- */
function HowItWorks() {
  const steps = [
    {
      title: 'Verify once, reuse everywhere',
      body: 'Complete KYB and receive a Business Passport — an on-chain identity any lender on Stellar can read.',
    },
    {
      title: 'Raise financing in USDC',
      body: 'Open a funding opportunity. Investors fund it in USDC and the risk band sets a fair rate.',
    },
    {
      title: 'Repay, and your score compounds',
      body: 'Each on-time, externally-funded repayment lifts the score, lowers your collateral and unlocks cheaper capital.',
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 bg-slate-50 py-20 lg:py-28">
      <Container className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            How it works
          </span>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
            Repay once. Borrow cheaper next time.
          </h2>
          <ol className="mt-12 space-y-9">
            {steps.map((s, i) => (
              <li key={s.title} className="relative grid grid-cols-[3rem_1fr] gap-5">
                {i < steps.length - 1 ? (
                  <span
                    className="absolute left-[1.05rem] top-11 h-[calc(100%+0.25rem)] w-px bg-slate-300"
                    aria-hidden
                  />
                ) : null}
                <span className="font-serif text-4xl font-medium leading-none text-brand-600">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:sticky lg:top-24">
          <ReputationSimulator />
        </div>
      </Container>
    </section>
  );
}

/* --------------------------- Two-layer passport --------------------------- */
const YOU_CONTROL = ['Colour theme', 'Pattern', 'How your name is presented'];
const WE_ATTEST = ['KYB status', 'Credit score & risk band', 'Repayment history', 'On-chain proof'];

const CONTRACT_ROWS: { call: string; who: string }[] = [
  { call: 'issue()  get()  is_active()', who: 'read / issue' },
  { call: 'update_metadata()', who: 'owner only' },
  { call: 'freeze()  revoke()  add_credential()', who: 'issuer only' },
  { call: 'apply_reputation()', who: 'score engine only' },
];

function TwoLayers() {
  return (
    <section
      id="passport"
      className="scroll-mt-20 relative overflow-hidden bg-night-950 py-20 text-white lg:py-28"
    >
      <div className="absolute inset-0 bg-grid opacity-40 mask-fade-b" aria-hidden />
      <Container className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
            Business Passport
          </span>
          <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl">
            Yours to style. <em className="text-gradient italic">Ours to verify.</em>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            The top of the Passport is your identity, and you decide how it looks. The bottom is
            your standing, and nobody — you included — gets to restyle it.
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
                You control
              </h3>
              <ul className="mt-3 space-y-2 text-[15px] text-slate-200">
                {YOU_CONTROL.map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Sparkle width={13} height={13} className="shrink-0 text-brand-300" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Fondealo attests
              </h3>
              <ul className="mt-3 space-y-2 text-[15px] text-slate-200">
                {WE_ATTEST.map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Lock width={13} height={13} className="shrink-0 text-slate-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-slate-500">
              <span>BusinessPassport · Soroban</span>
              <span>non-transferable</span>
            </div>
            <ul className="mt-4 space-y-2 font-mono text-[13px]">
              {CONTRACT_ROWS.map((r) => (
                <li
                  key={r.call}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 text-slate-200"
                >
                  <span>{r.call}</span>
                  <span className="text-xs text-slate-500">{r.who}</span>
                </li>
              ))}
              <li className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-white/10 pt-3">
                <span className="text-red-300/90 line-through decoration-red-300/50">
                  transfer() approve() transfer_from()
                </span>
                <span className="text-xs text-slate-500">deliberately absent</span>
              </li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">
              A credential can&apos;t be sold, lent or faked: ownership never moves. Implemented and
              tested in <code className="text-slate-300">packages/soroban</code>; Testnet deployment
              is next.
            </p>
          </div>
        </div>

        <LayerExplainer />
      </Container>
    </section>
  );
}

/* --------------------------- Reputation ring --------------------------- */
const LAYERS = [
  {
    name: 'Identity',
    color: '#34d399',
    body: 'KYB verified by a provider. PII stays off-chain; only a hash commitment goes on-chain.',
  },
  {
    name: 'Repayment',
    color: '#22d3ee',
    body: 'The share of loans repaid. On-time, investor-funded repayments are what raise the score.',
  },
  {
    name: 'Activity',
    color: '#fbbf24',
    body: 'How many loans the business has actually taken through Fondealo.',
  },
  {
    name: 'Longevity',
    color: '#a78bfa',
    body: 'How long the Passport has been building history. Reputation takes time.',
  },
];

function ReputationSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-[1fr_auto] lg:gap-24">
        <div>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Credit Reputation Ring
          </span>
          <h2 className="mt-4 max-w-xl font-serif text-4xl font-medium leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
            One score. Four ways to read it.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            The on-chain score is a single deterministic number. The ring shows what it is made of,
            so a lender can see why a business looks the way it does — and a business can see what
            to improve.
          </p>
          <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {LAYERS.map((l) => (
              <div key={l.name}>
                <dt className="flex items-center gap-2.5 font-display text-base font-semibold text-slate-900">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: l.color }}
                    aria-hidden
                  />
                  {l.name}
                </dt>
                <dd className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{l.body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-9 max-w-xl text-sm text-slate-500">
            Reputation compounds with diminishing returns near the cap, and self-funded round-trips
            are score-neutral, so it can&apos;t be gamed.
          </p>
        </div>

        <div className="mx-auto w-full max-w-[290px] rounded-3xl bg-night-950 p-6 shadow-soft">
          <ReputationRing passport={SHOWCASE_PASSPORT} size={220} />
        </div>
      </Container>
    </section>
  );
}

/* ----------------------------- Audiences ---------------------------- */
function Audiences() {
  return (
    <section className="bg-slate-50 py-20 lg:py-28">
      <Container>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col rounded-3xl bg-night-950 p-8 text-white sm:p-10">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-300">
              For businesses
            </span>
            <h3 className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight">
              Turn a clean track record into cheaper capital.
            </h3>
            <ul className="mt-7 space-y-3 text-[15px] text-slate-200">
              {[
                'Verify once and keep a Passport no one can take from you',
                'Lock less collateral with every on-time repayment',
                'Style the identity layer to look like your brand',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check width={16} height={16} className="mt-1 shrink-0 text-brand-400" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/onboarding?intent=business" className="mt-9 self-start">
              <Button size="lg">
                Get my Passport
                <ArrowRight width={18} height={18} />
              </Button>
            </Link>
          </article>

          <article className="flex flex-col rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
              For investors
            </span>
            <h3 className="mt-4 font-serif text-3xl font-medium leading-tight tracking-tight text-slate-900">
              Fund vetted SMEs and earn USDC returns.
            </h3>
            <ul className="mt-7 space-y-3 text-[15px] text-slate-700">
              {[
                'See each business’s score, band and collateral before you fund',
                'First-loss collateral is locked ahead of your capital',
                'Try it end to end with 10,000 test USDC on Testnet',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check width={16} height={16} className="mt-1 shrink-0 text-brand-600" />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/onboarding?intent=invest" className="mt-9 self-start">
              <Button variant="dark" size="lg">
                Explore opportunities
                <ArrowRight width={18} height={18} />
              </Button>
            </Link>
          </article>
        </div>
      </Container>
    </section>
  );
}

/* ----------------------------- CTA band ----------------------------- */
function CtaBand() {
  return (
    <section className="bg-slate-50 pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-night-950 px-8 py-14 text-center text-white sm:py-16">
          <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
          <div className="absolute inset-0 bg-radial-brand" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-serif text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Build credit that belongs to the business, not the bank.
            </h2>
            <p className="mt-4 text-slate-300">
              Fondealo is a Testnet MVP built for the Stellar Community Fund.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/onboarding">
                <Button size="lg">
                  Get started
                  <ArrowRight width={18} height={18} />
                </Button>
              </Link>
              <a href="https://github.com/adletgamer/Fondeal0" target="_blank" rel="noreferrer">
                <Button variant="ghost-light" size="lg">
                  View on GitHub
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
