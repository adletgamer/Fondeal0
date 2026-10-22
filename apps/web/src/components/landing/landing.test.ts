import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) =>
    createElement('img', { ...props, priority: undefined }),
}));
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) =>
    createElement('a', { href, ...rest }, children as never),
}));
// The real action imports Prisma and request headers; the page only needs its reference.
vi.mock('@/lib/actions/waitlist', () => ({ joinWaitlist: vi.fn() }));

const { default: HomeEs } = await import('@/app/page');
const { default: HomeEn } = await import('@/app/en/page');

const render = (C: () => unknown) => {
  const html = renderToStaticMarkup(createElement(C as never));
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return { html, text };
};
const es = render(HomeEs);
const en = render(HomeEn);

describe.each([
  ['es', es, 'es-PE', /Tu empresa ya tiene una historia\..*Hazla verificable\./s, '/en'],
  ['en', en, 'en', /Your company already has a story\..*Make it verifiable\./s, '/'],
] as const)('landing page (%s)', (_l, page, lang, h1, otherHref) => {
  it('has one h1 that says what Fondealo is, on two authored lines', () => {
    expect(page.html.match(/<h1/g)).toHaveLength(1);
    expect(page.html).toMatch(new RegExp(`<h1[^>]*>.*${h1.source}.*</h1>`, 's'));
  });

  it('declares its language and links to the other one', () => {
    expect(page.html).toContain(`lang="${lang}"`);
    expect(page.html).toMatch(
      new RegExp(`href="${otherHref}"[^>]*hrefLang=|hrefLang=[^>]*href="${otherHref}"`, 'i'),
    );
  });

  it('points every primary action at the waitlist, never at an investor flow', () => {
    expect(page.html).toContain('href="#lista"');
    expect(page.html).toContain('id="lista"');
    expect(page.html).not.toContain('intent=invest');
  });

  it('renders the waitlist form with its fields, honeypot and locale', () => {
    for (const name of ['email', 'profile', 'country', 'companyName', 'consent', 'website']) {
      expect(page.html).toContain(`name="${name}"`);
    }
    expect(page.html).toMatch(/name="locale" value="(es|en)"/);
    expect(page.html).not.toMatch(/name="consent"[^>]*checked=""/);
  });

  it('renders the live fragments readable without JavaScript', () => {
    expect(page.html.match(/role="radiogroup"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(page.html).toContain('aria-checked="true"');
    expect(page.html).toContain('aria-pressed=');
    expect(page.html.match(/data-ui/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it('renders the 3D stage with a poster, a label and no script dependency', () => {
    expect(page.html).toContain('data-scene="loading"');
    expect(page.html).toContain('/brand/3d/badge.webp');
    expect(page.html).toMatch(/role="img"[^>]*aria-label="[^"]*(ejemplo|sample)/i);
  });

  it('gives every section a heading', () => {
    const sections = page.html.match(/<section[^>]*>/g) ?? [];
    expect(sections.length).toBeGreaterThanOrEqual(6);
    for (const s of sections) expect(s).toMatch(/aria-labelledby="[a-z-]+"/);
  });

  it('offers section links on small screens, not only from lg up', () => {
    expect(page.html).toMatch(/aria-expanded="false"[^>]*aria-controls=/);
  });

  it('stays short: a landing, not a manual', () => {
    const words = page.text.split(' ').filter(Boolean).length;
    expect(words).toBeLessThan(700);
  });
});

describe('landing claims', () => {
  it('never offers investment, returns or approval in Spanish', () => {
    for (const phrase of [
      'oportunidad de inversión',
      'invertir en',
      'retorno',
      'rentabilidad',
      'garantizado',
      'deal flow',
      'conectamos con inversionistas',
      'inversionistas verificados',
      'levanta tu ronda',
      'startup aprobada',
      'pre-aprobado',
      'puntaje',
      'escrow',
      'usdc',
      'soroban',
      'sandbox',
      'kyb',
    ]) {
      expect(es.text).not.toContain(phrase);
    }
    expect(es.text).toContain('no invierte ni intermedia inversiones');
  });

  it('uses the passport vocabulary and keeps examples labelled', () => {
    expect(es.text).not.toContain('expediente');
    expect(en.text).not.toContain('company file');
    for (const phrase of ['pasaporte', 'señales', 'acceso con permiso', 'ilustración de ejemplo']) {
      expect(es.text).toContain(phrase);
    }
    for (const phrase of ['passport', 'signals', 'permissioned access', 'sample illustration']) {
      expect(en.text).toContain(phrase);
    }
    expect(es.text).toContain('aún no hay socios firmados');
    expect(en.text).toContain('no signed partners yet');
    expect(es.text).toContain('construido sobre stellar · piloto');
    expect(en.text).toContain('built on stellar · pilot');
  });

  it('never names a real company, fund or registry as a partner', () => {
    for (const phrase of ['sunat', 'sunarp', 'sbs', 'smv', 'cavali', 'interbank', 'bcp']) {
      expect(es.text).not.toMatch(new RegExp(`\\b${phrase}\\b`));
    }
  });

  it('never offers investment, returns or approval in English', () => {
    for (const phrase of [
      'investment opportunit',
      'invest in',
      'returns',
      'yield',
      'guaranteed',
      'deal flow',
      'verified investors',
      'raise your round',
      'pre-approved',
      'credit score',
      'escrow',
      'usdc',
      'soroban',
      'sandbox',
      'kyb',
    ]) {
      expect(en.text).not.toContain(phrase);
    }
    expect(en.text).toContain('does not lend');
  });
});

describe('landing source', () => {
  const dir = join(process.cwd(), 'src/components/landing');
  const files = [
    join(process.cwd(), 'src/app/page.tsx'),
    join(process.cwd(), 'src/app/en/page.tsx'),
    ...readdirSync(dir)
      .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
      .filter((f) => !f.endsWith('.test.ts'))
      .map((f) => join(dir, f)),
  ];

  it('uses design-system tokens only: no hard-coded hex colours', () => {
    for (const f of files) expect(readFileSync(f, 'utf8'), f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('has no text smaller than 12px and no monospace', () => {
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/text-\[(?:[0-9]|1[01])px\]/);
      expect(src, f).not.toMatch(/text-xs\b/);
      expect(src, f).not.toContain('font-mono');
    }
  });
});
