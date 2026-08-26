'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Button, Card, Field } from '@fondealo/ui';
import { EscrowClient, getNetworkConfig, submitSignedTransaction, transactionHashHex } from '@fondealo/sdk';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { useStellarWallet } from '@/hooks/use-stellar-wallet';
import { fundOpportunityOnChainAware, type ActionResult } from '@/lib/actions/opportunities';

/**
 * Real funding, not a simulation dressed up as one: this tries to build,
 * sign (via Privy's raw-hash signer for Stellar), and submit an actual
 * `loan_escrow.fund` transaction to Testnet first. That only succeeds once
 * the contract is deployed *and* the investor's wallet holds enough
 * Testnet USDC — until then (or on any hiccup: no trustline, network error,
 * declined signature) it falls back to recording the funding in the
 * off-chain projection, which is what keeps the demo usable end to end.
 */
export function FundPanel({
  opportunityId,
  remaining,
  aprBps,
  termDays,
  isOpen,
}: {
  opportunityId: string;
  remaining: number;
  aprBps: number;
  termDays: number;
  isOpen: boolean;
}) {
  const { stellarAddress } = useStellarWallet();
  const { signRawHash } = useSignRawHash();
  const [amount, setAmount] = useState(remaining > 0 ? Math.min(remaining, 500) : 0);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  const projectedReturn = useMemo(() => {
    const interest = (amount * aprBps * termDays) / (10_000 * 365);
    return amount + interest;
  }, [amount, aprBps, termDays]);

  async function tryOnChainFund(investor: string): Promise<string | null> {
    try {
      const cfg = getNetworkConfig();
      const escrow = new EscrowClient();
      const { xdr } = await escrow.fund(opportunityId, investor, String(Math.round(amount)));
      const hash = transactionHashHex(xdr, cfg.networkPassphrase);
      const { signature } = await signRawHash({ address: investor, chainType: 'stellar', hash });
      const submitted = await submitSignedTransaction(
        xdr,
        signature,
        investor,
        cfg.networkPassphrase,
        cfg.sorobanRpcUrl,
      );
      if (submitted.status === 'SUCCESS') {
        return `Funded on-chain — tx ${submitted.hash.slice(0, 10)}…`;
      }
      return null;
    } catch {
      // Expected today (no Testnet contract id yet); also the honest
      // outcome for "no USDC trustline/balance" or a declined signature.
      return null;
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stellarAddress || amount <= 0) return;
    setPending(true);
    setResult(null);

    const onChainMessage = await tryOnChainFund(stellarAddress);

    const formData = new FormData();
    formData.set('opportunityId', opportunityId);
    formData.set('investorAddress', stellarAddress);
    formData.set('amount', String(amount));
    const dbResult = await fundOpportunityOnChainAware(null, formData);

    setPending(false);
    setResult(dbResult.ok ? { ok: true, message: onChainMessage ?? dbResult.message } : dbResult);
  }

  if (!isOpen) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Funding closed</h2>
        <p className="mt-2 text-sm text-slate-500">
          This opportunity is no longer open for new funding.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Fund in USDC</h2>
      <p className="mt-1 text-sm text-slate-500">{remaining.toLocaleString()} USDC remaining.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {stellarAddress ? (
          <p className="text-xs text-slate-500">
            Funding as{' '}
            <span className="font-mono text-slate-700">
              {stellarAddress.slice(0, 6)}…{stellarAddress.slice(-6)}
            </span>
          </p>
        ) : null}
        <Field
          label="Amount"
          name="amount"
          type="number"
          min="1"
          max={remaining || undefined}
          step="1"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          hint="USDC"
          required
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAmount(Math.round(remaining * 0.25))}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            25%
          </button>
          <button
            type="button"
            onClick={() => setAmount(Math.round(remaining * 0.5))}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            50%
          </button>
          <button
            type="button"
            onClick={() => setAmount(remaining)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
          >
            Fund it all
          </button>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Projected return over {termDays} days</span>
            <span className="font-semibold text-slate-800">
              {projectedReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={pending || amount <= 0 || !stellarAddress}>
          {pending ? 'Funding…' : `Fund ${amount.toLocaleString()} USDC`}
        </Button>

        {result && !result.ok ? <p className="text-xs text-red-600">{result.error}</p> : null}
        {result && result.ok ? <p className="text-xs text-brand-600">{result.message}</p> : null}
      </form>
    </Card>
  );
}
