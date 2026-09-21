'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { describeError, getSession } from '@/lib/auth/session';
import { FUNDING_PROVIDERS, MAX_FAUCET_DEPOSIT_USDC } from '@/lib/providers/funding';
import { credit, ensureInitialGrant, usdcToStroops } from '@/lib/wallet/ledger';
import { prisma } from '@fondealo/database';

export type DepositResult = { ok: true; message: string } | { ok: false; error: string };

const depositSchema = z.object({
  providerId: z.string(),
  amount: z.coerce
    .number()
    .positive('Enter an amount greater than 0')
    .max(
      MAX_FAUCET_DEPOSIT_USDC,
      `The faucet gives at most ${MAX_FAUCET_DEPOSIT_USDC} USDC at a time`,
    ),
});

/** Adds Testnet USDC through a funding provider. Only the sandbox faucet is live; the wallet is the session's, never a form field. */
export async function depositTestFunds(
  _prev: DepositResult | null,
  formData: FormData,
): Promise<DepositResult> {
  const session = await getSession();
  if (!session?.stellarAddress) {
    return { ok: false, error: 'Your session expired. Refresh the page and log in again.' };
  }

  const parsed = depositSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid amount' };

  const provider = FUNDING_PROVIDERS.find((p) => p.id === parsed.data.providerId);
  if (!provider || provider.status !== 'available') {
    return { ok: false, error: 'That funding provider is not available yet.' };
  }

  const amount = Math.round(parsed.data.amount * 100) / 100;
  try {
    await ensureInitialGrant(session.stellarAddress);
    await credit(prisma, {
      address: session.stellarAddress,
      kind: 'Deposit',
      amountStroops: usdcToStroops(amount),
      provider: provider.id,
      reference: `Test deposit via ${provider.name}`,
    });
  } catch (err) {
    console.error('[depositTestFunds] failed:', describeError(err));
    return { ok: false, error: 'We could not add the funds. Try again in a moment.' };
  }

  revalidatePath('/invest', 'layout');
  revalidatePath('/business', 'layout');
  return { ok: true, message: `${amount.toLocaleString()} test USDC added to your balance.` };
}
