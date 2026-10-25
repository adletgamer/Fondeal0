import { previewEnabled } from './auth/staff';
import type { CaseView } from './cases';
import { fixtureCases } from './fixtures/cases';

/**
 * The only door to case data. Today it serves the example fixtures in preview
 * mode and nothing otherwise; the database-backed reader replaces the body in
 * increment 2 without touching a page.
 */
export async function listCases(now: Date): Promise<CaseView[]> {
  if (!previewEnabled()) return [];
  return fixtureCases(now).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export async function getCase(id: string, now: Date): Promise<CaseView | null> {
  const all = await listCases(now);
  return all.find((c) => c.id === id) ?? null;
}
