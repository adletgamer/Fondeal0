'use client';

import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { ShieldCheck } from './icons';

function truncate(address: string): string {
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}

/** Shows the real, logged-in Stellar address driving this page — replaces the old "paste an address" flow now that Privy gates this section. */
export function WalletStatusBar() {
  const { stellarAddress, logout } = useStellarWallet();
  if (!stellarAddress) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-brand-800">
        <ShieldCheck width={16} height={16} className="shrink-0" />
        <span>
          Logged in as <span className="font-mono font-medium">{truncate(stellarAddress)}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="shrink-0 text-xs font-medium text-brand-700 hover:underline"
      >
        Log out
      </button>
    </div>
  );
}
