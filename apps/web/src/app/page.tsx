import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@fondealo/ui';
import { dictionary } from '@/lib/i18n';
import { WalletConnect } from '@/components/wallet-connect';

export default function Home() {
  const en = dictionary.en;
  const es = dictionary.es;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-emerald-700">Fondealo</span>
        <WalletConnect />
      </header>

      <section className="mb-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-emerald-700">
          Stellar · Soroban · USDC
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          {en.tagline}
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">{en.heroBody}</p>
        <p className="mt-4 max-w-2xl text-base text-slate-500">{es.heroBody}</p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{en.forBusinesses}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-slate-600">{en.businessPitch}</p>
            <Link href="/dashboard/business">
              <Button>{en.openBusiness}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{en.forInvestors}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-slate-600">{en.investorPitch}</p>
            <Link href="/dashboard/investor">
              <Button variant="secondary">{en.openInvestor}</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
