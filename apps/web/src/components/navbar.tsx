import Link from 'next/link';
import { Container } from '@fondealo/ui';
import { Logo } from './icons';
import { WalletConnect } from './wallet-connect';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" aria-label="Fondealo home" className="text-slate-900">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#how" className="transition-colors hover:text-slate-900">
            How it works
          </Link>
          <Link href="/#passport" className="transition-colors hover:text-slate-900">
            Passport
          </Link>
          <Link href="/#compose" className="transition-colors hover:text-slate-900">
            Composability
          </Link>
          <Link href="/dashboard/investor" className="transition-colors hover:text-slate-900">
            Invest
          </Link>
        </nav>
        <WalletConnect />
      </Container>
    </header>
  );
}
