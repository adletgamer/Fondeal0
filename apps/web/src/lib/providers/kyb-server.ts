import { z } from 'zod';
import { sandboxDecision } from './kyb';

const checkSchema = z.object({
  providerId: z.string().min(1),
  sourceType: z.enum(['synthetic', 'official-registry', 'third-party']),
  checkType: z.string().min(1),
  result: z.enum(['SyntheticPass', 'SyntheticFail', 'Unavailable', 'NeedsReview']),
  checkedAt: z.date(),
  expiresAt: z.date().nullable(),
  reasonCodes: z.array(z.string().min(1)).max(10),
  failureCode: z.string().nullable(),
  retryable: z.boolean(),
});

export type NormalizedCheck = z.infer<typeof checkSchema>;
export interface VerificationProvider {
  readonly id: string;
  check(input: { country: string; taxId: string }, signal: AbortSignal): Promise<unknown>;
}

/** Synthetic format signal only. Neither result is a legal-entity verification. */
export const SandboxVerifier: VerificationProvider = {
  id: 'sandbox',
  async check({ taxId }) {
    const signal = sandboxDecision(taxId);
    return {
      providerId: 'sandbox',
      sourceType: 'synthetic',
      checkType: 'tax-id-format',
      result: signal.accepted ? 'SyntheticPass' : 'SyntheticFail',
      checkedAt: new Date(),
      expiresAt: null,
      reasonCodes: [signal.accepted ? 'FORMAT_ONLY' : 'SANDBOX_NEGATIVE_CASE'],
      failureCode: null,
      retryable: false,
    };
  },
};

/** No registry request is made until an authorized endpoint, credentials and terms are approved. */
export const PeruRegistryVerifier: VerificationProvider = {
  id: 'peru-registry',
  async check() {
    return {
      providerId: 'peru-registry',
      sourceType: 'official-registry',
      checkType: 'legal-entity',
      result: 'Unavailable',
      checkedAt: new Date(),
      expiresAt: null,
      reasonCodes: ['INTEGRATION_NOT_CONFIGURED'],
      failureCode: 'CREDENTIALS_OR_ENDPOINT_UNAVAILABLE',
      retryable: false,
    };
  },
};

/** Timeouts and malformed responses produce reviewable failures, never approval. */
export async function runProviderCheck(
  provider: VerificationProvider,
  input: { country: string; taxId: string },
  timeoutMs = 3000,
): Promise<NormalizedCheck> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      provider.check(input, controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('PROVIDER_TIMEOUT'));
        }, timeoutMs);
      }),
    ]);
    const parsed = checkSchema.safeParse(response);
    if (!parsed.success || parsed.data.providerId !== provider.id) {
      return unavailable(provider.id, 'MALFORMED_RESPONSE', false);
    }
    return parsed.data;
  } catch (error) {
    return unavailable(
      provider.id,
      error instanceof Error && error.message === 'PROVIDER_TIMEOUT'
        ? 'PROVIDER_TIMEOUT'
        : 'PROVIDER_ERROR',
      true,
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function unavailable(providerId: string, code: string, retryable: boolean): NormalizedCheck {
  return {
    providerId,
    sourceType: 'third-party',
    checkType: 'legal-entity',
    result: 'Unavailable',
    checkedAt: new Date(),
    expiresAt: null,
    reasonCodes: [code],
    failureCode: code,
    retryable,
  };
}
