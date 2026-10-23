import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) =>
    createElement('a', { href, ...rest }, children as never),
}));

const { CaseQueue } = await import('./case-queue');
const { DecisionPanel } = await import('./decision-panel');
const { Shell } = await import('./shell');
const { fixtureCases } = await import('@/lib/fixtures/cases');

const now = new Date('2026-10-22T15:00:00Z');
const cases = fixtureCases(now);
const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const staff = {
  id: 'p',
  name: 'Vista previa',
  roles: ['Approver'] as const,
  status: 'Active' as const,
  preview: true,
};
const caps = { persistsDecisions: false, queuesPassportIssuance: false };

describe('review queue', () => {
  it('masks tax numbers and links every case', () => {
    const html = renderToStaticMarkup(createElement(CaseQueue, { cases, filter: 'todos', now }));
    expect(html).not.toContain('20999000022');
    expect(html).toContain('209••••0022');
    for (const c of cases) expect(html).toContain(`href="/cases/${c.id}"`);
  });

  it('filters by state and says so when a filter is empty', () => {
    const html = renderToStaticMarkup(
      createElement(CaseQueue, { cases, filter: 'aprobados', now }),
    );
    expect(html).toContain('Textiles Qori EIRL');
    expect(html).not.toContain('Kallpa Labs SAC');
    const empty = renderToStaticMarkup(
      createElement(CaseQueue, { cases: [], filter: 'todos', now }),
    );
    expect(text(empty)).toContain('No hay casos');
  });

  it('states that approving is not a financing decision', () => {
    const html = renderToStaticMarkup(createElement(CaseQueue, { cases, filter: 'todos', now }));
    expect(text(html)).toContain('no aprueba financiamiento');
  });
});

describe('decision panel', () => {
  const render = (status: Parameters<typeof DecisionPanel>[0]['status']) =>
    text(
      renderToStaticMarkup(
        createElement(DecisionPanel, {
          legalName: 'X SAC',
          status,
          actor: { id: 'p', roles: ['Approver'], status: 'Active' },
          preparedBy: 'p',
          separation: 'solo',
          env: 'testnet',
          capabilities: caps,
        }),
      ),
    );

  it('offers only the actions the state allows', () => {
    expect(render('Received')).toContain('Tomar el caso');
    expect(render('Received')).not.toContain('Aprobar KYB');
    expect(render('InReview')).toContain('Aprobar KYB');
    expect(render('InReview')).toContain('Pedir información');
    expect(render('Rejected')).toContain('Reabrir');
    expect(render('Rejected')).not.toContain('Aprobar KYB');
  });

  it('names the policy version it decides under', () => {
    expect(render('InReview')).toContain('kyb-v1-draft');
  });

  it('says so when one person prepares and decides', () => {
    expect(render('InReview')).toContain('Modo de un solo operador');
  });
});

describe('shell', () => {
  it('labels the environment and the preview, and says nothing is saved', () => {
    const html = text(
      renderToStaticMarkup(
        <Shell staff={staff} env="testnet">
          <p>x</p>
        </Shell>,
      ),
    );
    expect(html).toContain('Testnet');
    expect(html).toContain('Datos de ejemplo');
    expect(html).toContain('las decisiones aún no se guardan');
  });
});
