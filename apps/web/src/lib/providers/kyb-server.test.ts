import { describe, expect, it } from 'vitest';
import {
  PeruRegistryVerifier,
  runProviderCheck,
  SandboxVerifier,
  type VerificationProvider,
} from './kyb-server';

const input = { country: 'Peru', taxId: '20123456781' };

describe('KYB provider boundary', () => {
  it('labels sandbox signals as synthetic, never verified', async () => {
    const result = await runProviderCheck(SandboxVerifier, input);
    expect(result).toMatchObject({ sourceType: 'synthetic', result: 'SyntheticPass' });
  });

  it('keeps the Peru registry unavailable without approved integration', async () => {
    const result = await runProviderCheck(PeruRegistryVerifier, input);
    expect(result).toMatchObject({
      result: 'Unavailable',
      failureCode: 'CREDENTIALS_OR_ENDPOINT_UNAVAILABLE',
    });
  });

  it('normalizes timeout and malformed responses to unavailable', async () => {
    const hung: VerificationProvider = { id: 'hung', check: () => new Promise(() => {}) };
    expect(await runProviderCheck(hung, input, 5)).toMatchObject({
      result: 'Unavailable',
      failureCode: 'PROVIDER_TIMEOUT',
    });
    const malformed: VerificationProvider = {
      id: 'malformed',
      check: async () => ({ approved: true }),
    };
    expect(await runProviderCheck(malformed, input)).toMatchObject({
      result: 'Unavailable',
      failureCode: 'MALFORMED_RESPONSE',
    });
  });
});
