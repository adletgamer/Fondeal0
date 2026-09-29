import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Field,
  RiskBadge,
  SelectField,
} from '@fondealo/ui';
import { Navbar } from '@/components/navbar';

/**
 * Living style guide for the Fondealo design system: every shared component in
 * its states, rendered with the real tokens so a theme switch (navbar) checks
 * Night and Day. Hidden in production unless FDO_DESIGN_SYSTEM=1.
 */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Design system — Fondealo',
  robots: { index: false, follow: false },
};

const SWATCHES = [
  ['surface-0', 'bg-surface-0'],
  ['surface-100', 'bg-surface-100'],
  ['surface-200', 'bg-surface-200'],
  ['surface-300', 'bg-surface-300'],
  ['brand-fill', 'bg-brand-fill'],
  ['brand-soft', 'bg-brand-soft'],
  ['gold-fill', 'bg-gold-fill'],
  ['gold-soft', 'bg-gold-soft'],
  ['info-soft', 'bg-info-soft'],
  ['danger-soft', 'bg-danger-soft'],
  ['holo', 'bg-holo'],
  ['ink', 'bg-ink'],
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production' && process.env.FDO_DESIGN_SYSTEM !== '1') notFound();

  return (
    <>
      <Navbar />
      <Container className="space-y-14 py-12">
        <header>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            Fondealo · Design system
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Components</h1>
          <p className="mt-2 max-w-xl text-ink-muted">
            Every shared component in its states. Use the sun / moon in the navbar to check Night
            and Day.
          </p>
        </header>

        <Section id="tokens" title="Colour tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {SWATCHES.map(([name, cls]) => (
              <div key={name} className="overflow-hidden rounded-xl border border-line">
                <div className={`h-14 ${cls}`} />
                <div className="bg-surface-100 px-3 py-2 font-mono text-xs text-ink-muted">
                  {name}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <span className="text-ink">ink</span>
            <span className="text-ink-muted">ink-muted</span>
            <span className="text-ink-faint">ink-faint</span>
            <span className="text-brand-text">brand-text</span>
            <span className="text-gold-text">gold-text</span>
            <span className="text-info-text">info-text</span>
            <span className="text-danger-text">danger-text</span>
            <span className="font-mono text-ink">GBX4…7QZK · 12,500.00 USDC</span>
          </div>
        </Section>

        <Section id="button" title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Connect wallet</Button>
            <Button variant="gold">Fund in USDC</Button>
            <Button variant="dark">Explore</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="outline">View passport</Button>
            <Button variant="ghost">Details</Button>
            <Button disabled>Signing…</Button>
          </div>
          <Island>
            <Button>Get your Business Passport</Button>
            <Button variant="ghost-light">Fund opportunities</Button>
          </Island>
        </Section>

        <Section id="badge" title="Badge">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="brand" dot="live">
              Stellar Testnet
            </Badge>
            <Badge variant="brand">KYB verified</Badge>
            <Badge variant="gold">9.4% APY</Badge>
            <Badge variant="info" dot="static">
              Pending
            </Badge>
            <Badge variant="danger">Overdue</Badge>
            <Badge variant="neutral">Soroban</Badge>
          </div>
          <Island>
            <Badge variant="outline">Stellar · Soroban · USDC</Badge>
          </Island>
        </Section>

        <Section id="card" title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Café Andino SAC</CardTitle>
                <CardDescription>Working capital for harvest season.</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="font-mono text-xl">25,000.00 USDC</span>
              </CardContent>
            </Card>
            <Card live>
              <CardHeader>
                <CardTitle>Textiles Quispe</CardTitle>
                <CardDescription>Inventory financing · band B · funding now.</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="font-mono text-xl">12,500.00 USDC</span>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section id="field" title="Field">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Business name" placeholder="Café Andino SAC" hint="As registered." />
            <Field label="Amount to fund" unit="USDC" defaultValue="2500" type="number" />
            <Field
              label="Stellar address"
              mono
              defaultValue="GBX4Q"
              error="Not a valid G… address."
            />
            <SelectField label="Sector" defaultValue="agri">
              <option value="agri">Agriculture</option>
              <option value="retail">Retail</option>
            </SelectField>
          </div>
        </Section>

        <Section id="risk" title="RiskBadge">
          <div className="flex flex-wrap items-center gap-3">
            {(['A', 'B', 'C', 'D', 'E'] as const).map((b) => (
              <RiskBadge key={b} band={b} />
            ))}
            <RiskBadge band="C" compact />
          </div>
          <Island>
            <RiskBadge band="A" />
            <RiskBadge band="E" />
          </Island>
        </Section>
      </Container>
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4" data-testid={`ds-${id}`}>
      <h2 className="border-b border-line pb-2 font-display text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A dark island, as on the landing hero: components must read here in both themes. */
function Island({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-night-950 p-5 text-white">
      {children}
    </div>
  );
}
