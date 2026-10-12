import { describe, expect, it } from 'vitest';
import { evidenceUploadAvailability, validateEvidenceFileMetadata } from './policy';

describe('evidence upload gate', () => {
  it('rejects oversized or unsupported files', () => {
    expect(
      validateEvidenceFileMetadata({
        name: 'large.pdf',
        type: 'application/pdf',
        size: 6 * 1024 * 1024,
      }),
    ).toBeTruthy();
    expect(
      validateEvidenceFileMetadata({
        name: 'script.exe',
        type: 'application/octet-stream',
        size: 200,
      }),
    ).toBeTruthy();
  });

  it('does not enable uploads after metadata validation', () => {
    expect(
      validateEvidenceFileMetadata({ name: 'synthetic.pdf', type: 'application/pdf', size: 100 }),
    ).toBeNull();
    expect(evidenceUploadAvailability()).toBe('disabled');
  });
});
