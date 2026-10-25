import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifySyntheticResponseSignature } from './synthetic-peru-x402-provider';

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

describe('synthetic provider response signature', () => {
  it('accepts signed canonical response data and rejects tampering', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const body = {
      providerId: 'synthetic-registry-pe',
      result: 'active',
      reasonCodes: ['ENTITY_ACTIVE'],
    };
    const signature = sign(null, Buffer.from(canonicalize(body)), privateKey).toString('base64');
    const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

    expect(verifySyntheticResponseSignature(body, signature, publicKeyPem)).toBe(true);
    expect(
      verifySyntheticResponseSignature({ ...body, result: 'inactive' }, signature, publicKeyPem),
    ).toBe(false);
    expect(verifySyntheticResponseSignature(body, 'not-a-signature', publicKeyPem)).toBe(false);
  });
});
