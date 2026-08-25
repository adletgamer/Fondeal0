'use client';

import { useCallback, useState } from 'react';
import { Button } from '@fondealo/ui';
import { connectWallet } from '@fondealo/sdk';
import { Wallet } from './icons';

/** Client-side wallet connect button backed by Stellar Wallets Kit (SEP-10 next). */
export function WalletConnect({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onConnect = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { address: addr } = await connectWallet();
      setAddress(addr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(false);
    }
  }, []);

  if (address) {
    return (
      <span className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 font-mono text-xs text-brand-800">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        {address.slice(0, 5)}…{address.slice(-5)}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="dark" size={size} onClick={onConnect} disabled={loading}>
        <Wallet width={16} height={16} />
        {loading ? 'Connecting…' : 'Connect wallet'}
      </Button>
      {error ? (
        <span className="max-w-[12rem] text-right text-xs text-red-600">{error}</span>
      ) : null}
    </div>
  );
}
