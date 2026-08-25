import Link from 'next/link';
import { Container } from '@fondealo/ui';
import { Logo } from './icons';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo className="text-slate-900" />
          <p className="mt-4 text-sm text-slate-500">
            Credit infrastructure for Latin American SMEs, built natively on Stellar. A reusable
            Business Passport and portable on-chain reputation.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div>
            <div className="mb-3 font-semibold text-slate-900">Product</div>
            <ul className="space-y-2 text-slate-500">
              <li>
                <Link href="/dashboard/business" className="hover:text-brand-700">
                  For businesses
                </Link>
              </li>
              <li>
                <Link href="/dashboard/investor" className="hover:text-brand-700">
                  For investors
                </Link>
              </li>
              <li>
                <Link href="/#passport" className="hover:text-brand-700">
                  Business Passport
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-3 font-semibold text-slate-900">Built on</div>
            <ul className="space-y-2 text-slate-500">
              <li>Stellar · Soroban</li>
              <li>USDC (SAC)</li>
              <li>Blend · Reflector</li>
            </ul>
          </div>
          <div>
            <div className="mb-3 font-semibold text-slate-900">Project</div>
            <ul className="space-y-2 text-slate-500">
              <li>
                <a
                  href="https://github.com/adletgamer/Fondeal0"
                  className="hover:text-brand-700"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>Stellar Community Fund</li>
            </ul>
          </div>
        </div>
      </Container>
      <div className="border-t border-slate-100">
        <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} Fondealo. Testnet MVP.</span>
          <span>Built for the Stellar ecosystem.</span>
        </Container>
      </div>
    </footer>
  );
}
