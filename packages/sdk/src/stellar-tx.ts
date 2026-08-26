/**
 * Sign-and-submit helpers for transactions built by {@link EscrowClient}'s
 * write methods. Framework/wallet-agnostic on purpose: it takes a raw
 * Ed25519 signature over the transaction's signature-base hash, not a
 * specific wallet SDK's types — the caller gets that signature however it
 * wants (this app uses Privy's `useSignRawHash` for its Stellar Tier-2
 * embedded wallet, see apps/web/src/hooks/use-stellar-wallet.ts).
 */
import { Buffer } from 'buffer';
import { Keypair, rpc, TransactionBuilder, xdr, type Transaction } from '@stellar/stellar-sdk';

/** The signature-base hash an external signer must sign for this transaction. */
export function transactionHashHex(xdrEnvelope: string, networkPassphrase: string): `0x${string}` {
  const tx = TransactionBuilder.fromXDR(xdrEnvelope, networkPassphrase) as Transaction;
  return `0x${tx.hash().toString('hex')}`;
}

export interface SubmitResult {
  /** Soroban RPC transaction status: SUCCESS, FAILED, or NOT_FOUND if polling timed out. */
  status: string;
  hash: string;
}

/**
 * Attach an externally-produced signature to an unsigned transaction
 * envelope and submit it, polling until it leaves `NOT_FOUND`. Assumes the
 * signer is the transaction's own source account (the common case here:
 * business/investor/keeper sign their own calls), so one classic Ed25519
 * signature satisfies both the fee source and the contract's `require_auth`.
 */
export async function submitSignedTransaction(
  xdrEnvelope: string,
  signatureHex: string,
  signerAddress: string,
  networkPassphrase: string,
  rpcUrl: string,
): Promise<SubmitResult> {
  const tx = TransactionBuilder.fromXDR(xdrEnvelope, networkPassphrase) as Transaction;
  const keypair = Keypair.fromPublicKey(signerAddress);
  const signatureBytes = Buffer.from(signatureHex.replace(/^0x/, ''), 'hex');
  tx.signatures.push(
    new xdr.DecoratedSignature({
      hint: keypair.signatureHint(),
      signature: signatureBytes,
    }),
  );

  const server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
  const sent = await server.sendTransaction(tx);
  if (sent.status === 'ERROR') {
    throw new Error(`Transaction rejected: ${JSON.stringify(sent.errorResult ?? sent.status)}`);
  }

  const deadline = Date.now() + 30_000;
  let result = await server.getTransaction(sent.hash);
  while (result.status === 'NOT_FOUND' && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    result = await server.getTransaction(sent.hash);
  }
  return { status: result.status, hash: sent.hash };
}
