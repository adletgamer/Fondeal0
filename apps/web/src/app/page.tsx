import Link from 'next/link';
import { Badge, Button, Card, Container } from '@fondealo/ui';
import { RiskBand } from '@fondealo/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ScoreGauge } from '@/components/score-gauge';
import {
  ArrowRight,
  Building,
  Coins,
  FileCheck,
  Landmark,
  Layers,
  Lock,
  Repeat,
  ShieldCheck,
  Sparkle,
  TrendingUp,
} from '@/components/icons';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Composability />
        <HowItWorks />
        <Differentiators />
        <Audiences />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------- Hero ------------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-night-950 text-white">
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-70" aria-hidden />
      <div className="absolute inset-0 bg-radial-brand" aria-hidden />
      <Container className="relative grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="animate-fade-up">
          <Badge variant="outline" className="mb-6">
            <Sparkle width={14} height={14} className="text-brand-300" />
            Stellar · Soroban · USDC
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            On-chain credit that <span className="text-gradient">travels with the business</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Fondealo gives every Latin American SME a reusable{' '}
            <strong className="font-semibold text-white">Business Passport</strong> and a portable
            credit reputation that grows with each repayment — and survives across loans.
          </p>
          <p className="mt-3 max-w-xl text-sm text-slate-400">
            Infraestructura de crédito para PyMEs latinoamericanas, sobre Stellar. Identidad y
            reputación crediticia on-chain, reutilizables entre préstamos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
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
          <div className="mt-8 flex items-center gap-6 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Lock width={14} height={14} /> Non-custodial · SEP-10
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers width={14} height={14} /> Composes with Blend
            </span>
          </div>
        </div>
        <div className="animate-fade-up lg:justify-self-end">
          <PassportShowcase />
        </div>
      </Container>
    </section>
  );
}

/** Glassmorphic mock of the on-chain Business Passport — the hero visual. */
function PassportShowcase() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute -inset-4 rounded-[2rem] bg-brand-500/20 blur-2xl" aria-hidden />
      <div className="relative animate-float rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
            <ShieldCheck width={18} height={18} className="text-brand-300" />
            Business Passport
          </div>
          <span className="rounded-full bg-brand-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-300">
            KYB · Accepted
          </span>
        </div>
        <div className="my-6 grid place-items-center">
          <ScoreGauge score={720} band={RiskBand.B} size={176} />
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Repaid', '8 / 8'],
            ['Streak', '8'],
            ['Since', '2025'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white/5 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-400">{k}</dt>
              <dd className="mt-0.5 font-display text-sm font-semibold text-white">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
          <span className="font-mono">GBODEGA…LIMA</span>
          <span className="inline-flex items-center gap-1 text-brand-300">
            <Repeat width={13} height={13} /> portable
          </span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Composability -------------------------- */
function Composability() {
  const legos = [
    { name: 'Blend', role: 'Lending', icon: Landmark },
    { name: 'Reflector', role: 'Oracle', icon: TrendingUp },
    { name: 'DeFindex', role: 'Yield', icon: Layers },
    { name: 'USDC', role: 'Settlement', icon: Coins },
  ];
  return (
    <section id="compose" className="border-b border-slate-200 bg-white py-12">
      <Container>
        <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-400">
          We don&apos;t rebuild lending — we compose the Stellar money-legos and own the credit
          layer
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {legos.map(({ name, role, icon: Icon }) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon width={20} height={20} />
              </span>
              <span>
                <span className="block font-display font-semibold text-slate-900">{name}</span>
                <span className="block text-xs text-slate-500">{role}</span>
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* --------------------------- How it works --------------------------- */
function HowItWorks() {
  const steps = [
    {
      icon: FileCheck,
      title: 'Verify once, reuse everywhere',
      body: 'A business completes KYB and receives a Business Passport — an on-chain identity any lender on Stellar can read.',
    },
    {
      icon: Coins,
      title: 'Raise financing in USDC',
      body: 'Create a funding opportunity. Investors deposit USDC and fund it; the risk band sets a fair rate.',
    },
    {
      icon: TrendingUp,
      title: 'Repay and your score compounds',
      body: 'Every on-time, externally-funded repayment raises the score, lowers risk, and unlocks cheaper capital next time.',
    },
  ];
  return (
    <section id="how" className="py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="One clean loop, from identity to reputation"
          subtitle="Register → KYB → Business Passport → fund in USDC → repay → score up."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <Card key={title} className="relative p-6">
              <span className="absolute right-5 top-5 font-display text-5xl font-bold text-slate-100">
                {i + 1}
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-glow">
                <Icon width={22} height={22} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* -------------------------- Differentiators ------------------------- */
function Differentiators() {
  return (
    <section id="passport" className="bg-white py-20 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow="What makes Fondealo different"
          title="The credit layer Stellar DeFi is missing"
          subtitle="Two primitives other lenders can consume: a reusable identity and a portable reputation."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="flex items-start gap-4 p-8">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
                <ShieldCheck width={24} height={24} />
              </span>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Business Passport</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  A reusable, verifiable business identity stored on Soroban: KYB status, score,
                  risk band, and repayment history. Read by any contract — PII stays off-chain, only
                  a hash commitment goes on it.
                </p>
              </div>
            </div>
            <ul className="grid gap-px bg-slate-100 text-sm sm:grid-cols-2">
              {[
                'KYB-gated issuance',
                'Verifiable from Soroban',
                'TTL-kept-alive',
                'Composable trust primitive',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 bg-white px-8 py-3 text-slate-600">
                  <ShieldCheck width={15} height={15} className="text-brand-500" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="grid gap-6 p-8 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="justify-self-center">
                <ScoreGauge score={640} band={RiskBand.C} size={150} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Credit Reputation Score</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Deterministic and on-chain. Each successful repayment compounds it — with
                  diminishing returns near the cap. Self-funded round-trips are score-neutral, so
                  reputation can&apos;t be gamed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {['Portable across loans', 'Anti-gaming', 'Transparent formula'].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-gold-300/60 bg-gold-50 px-2.5 py-1 font-medium text-gold-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

/* ----------------------------- Audiences ---------------------------- */
function Audiences() {
  const cards = [
    {
      icon: Building,
      tag: 'For businesses',
      title: 'Turn a clean track record into cheaper capital',
      body: 'Register, complete KYB, get your Passport, and request USDC financing. Every repayment makes the next loan cheaper.',
      cta: 'Business dashboard',
      href: '/onboarding?intent=business',
      variant: 'primary' as const,
    },
    {
      icon: Landmark,
      tag: 'For investors',
      title: 'Fund vetted SMEs and earn USDC returns',
      body: 'Deposit USDC, back opportunities scored by on-chain reputation, and receive returns as businesses repay.',
      cta: 'Investor dashboard',
      href: '/onboarding?intent=invest',
      variant: 'dark' as const,
    },
  ];
  return (
    <section className="py-20 lg:py-24">
      <Container className="grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.tag} className="flex flex-col p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
              <c.icon width={22} height={22} />
            </span>
            <span className="mt-5 text-sm font-semibold text-brand-600">{c.tag}</span>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{c.body}</p>
            <Link href={c.href} className="mt-6">
              <Button variant={c.variant}>
                {c.cta}
                <ArrowRight width={18} height={18} />
              </Button>
            </Link>
          </Card>
        ))}
      </Container>
    </section>
  );
}

/* ----------------------------- CTA band ----------------------------- */
function CtaBand() {
  return (
    <section className="pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-night-950 px-8 py-14 text-center text-white">
          <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
          <div className="absolute inset-0 bg-radial-brand" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Build credit that belongs to the business — not the bank.
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

/* ------------------------------ Shared ------------------------------ */
function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-slate-500">{subtitle}</p>
    </div>
  );
}
