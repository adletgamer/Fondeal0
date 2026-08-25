'use client';

import { useCallback, useState } from 'react';
import { Button } from '@fondealo/ui';
import { connectWallet } from '@fondealo/sdk';

/** Client-side wallet connect button backed by Stellar Wallets Kit (SEP-10 next). */
export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onConnect = useCallback(async () => {
    setError(null);
    try {
      const { address: addr } = await connectWallet();
      setAddress(addr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, []);

  if (address) {
    return (
      <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
        {address.slice(0, 6)}…{address.slice(-6)}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={onConnect}>Connect wallet</Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
