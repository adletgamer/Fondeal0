import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '@fondealo/database';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Opt-in real PostgreSQL regression. Never connect to the application database.
const testUrl = process.env.KYB_TEST_DATABASE_URL;
const fixture = vi.hoisted(() => ({ prisma: null as unknown }));
vi.mock('@fondealo/database', () => ({
  get prisma() {
    return fixture.prisma;
  },
}));
vi.mock('@/lib/auth/session', () => ({
  getSession: async () => ({
    privyUserId: 'synthetic-kyb-owner',
    stellarAddress: 'GSYNTHETICKYBOWNER',
    role: 'Business',
  }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe.skipIf(!testUrl)('KYB intake without the experimental acquisition migration', () => {
  let prisma: PrismaClient;
  let schema: string;
  const retryToken = randomUUID();

  beforeAll(async () => {
    const url = new URL(testUrl!);
    if (
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.pathname !== '/fondealo_kyb_test'
    ) {
      throw new Error('Use a local disposable database named fondealo_kyb_test only');
    }
    schema = `kyb_test_${randomUUID().replaceAll('-', '')}`;
    url.searchParams.set('schema', schema);
    const databaseDir = fileURLToPath(
      new URL('../../../../../packages/database/', import.meta.url),
    );
    const require = createRequire(`${databaseDir}package.json`);
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({ datasourceUrl: url.toString() });
    fixture.prisma = prisma;
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    const cli = require.resolve('prisma/build/index.js');
    const migrations = `${databaseDir}prisma/migrations`;
    for (const migration of readdirSync(migrations).sort()) {
      if (!/^\d/.test(migration) || migration >= '20261025000000') continue;
      execFileSync(process.execPath, [
        cli,
        'db',
        'execute',
        '--url',
        url.toString(),
        '--file',
        `${migrations}/${migration}/migration.sql`,
      ]);
    }
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
      await prisma.$disconnect();
    }
  });

  it('persists a pending application, consent, evidence and audit, with safe retries', async () => {
    // This fixture deliberately lacks the new ProviderCheck return column.
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = ${schema} AND table_name = 'ProviderCheck'
        AND column_name = 'evidenceAcquisitionId'
    `;
    expect(columns).toEqual([]);
    const { submitKyb } = await import('./kyb');
    const form = new FormData();
    for (const [key, value] of Object.entries({
      locale: 'en',
      legalName: 'Synthetic Demo Company SAC',
      country: 'Peru',
      taxId: '20123456781',
      sector: 'Retail',
      foundedYear: '2020',
      revenueBand: '$5k – $25k / month',
      email: 'demo@example.com',
      representativeName: 'Synthetic Owner',
      representativeRelationship: 'Owner',
      idempotencyKey: retryToken,
      verifierId: 'sandbox',
      accept: 'on',
      evidenceConsent: 'on',
    }))
      form.set(key, value);
    form.append('docs', 'registration');
    form.append('docs', 'tax-id');

    const result = await submitKyb(null, form);
    expect(result).toMatchObject({ ok: true, status: 'Processing' });
    expect(await submitKyb(null, form)).toEqual(result);
    const submission = await prisma.kybSubmission.findUniqueOrThrow({
      where: { idempotencyKey: retryToken },
    });
    expect(submission.status).toBe('Processing');
    expect(submission.reviewedAt).toBeNull();
    expect(submission.consentAt).toBeInstanceOf(Date);
    expect(submission.consentVersion).toBe('kyb-intake-v1-en');
    expect(await prisma.evidenceReference.count()).toBe(2);
    expect(await prisma.providerCheck.count()).toBe(1);
    expect(await prisma.verificationAuditEvent.count()).toBe(2);
    expect(await prisma.passportProjection.count()).toBe(0);
  });
});
