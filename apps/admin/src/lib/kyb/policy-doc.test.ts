import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  POLICY_ITEMS,
  POLICY_VERSION,
  APPROVAL_VALIDITY_DAYS,
  COOLING_OFF_MINUTES,
} from './policy';
import { REASON_CODES } from './reason-codes';

const doc = readFileSync(join(process.cwd(), '../../docs/kyb/policy-v1.md'), 'utf8');

/** The owner approves the document; the code must say exactly the same. */
describe('policy document matches the code', () => {
  it('names the same version', () => {
    expect(doc).toContain(`\`${POLICY_VERSION}\``);
  });

  it('lists every reason code with the message the business sees', () => {
    for (const r of REASON_CODES) {
      expect(doc, r.code).toContain(`\`${r.code}\``);
      expect(doc, r.code).toContain(r.userMessage);
    }
  });

  it('lists every policy item and whether it is required', () => {
    for (const i of POLICY_ITEMS) {
      const row = doc.split('\n').find((l) => l.startsWith(`| ${i.label} |`));
      expect(row, i.label).toBeDefined();
      expect(row, i.label).toContain(i.required ? '| Sí |' : '| No (por ahora) |');
    }
  });

  it('states the validity and the cooling-off window', () => {
    expect(doc).toContain(`${APPROVAL_VALIDITY_DAYS} días`);
    expect(doc).toContain(`${COOLING_OFF_MINUTES} minutos`);
  });
});
