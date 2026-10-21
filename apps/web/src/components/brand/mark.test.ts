import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FondealoLogo, FondealoMark, type FondealoMarkProps, type FondealoLogoProps } from './mark';

const mark = (p: FondealoMarkProps = {}) => renderToStaticMarkup(createElement(FondealoMark, p));
const logo = (p: FondealoLogoProps = {}) => renderToStaticMarkup(createElement(FondealoLogo, p));

/** Paint attributes outside <defs> (masks legitimately use white/black). */
const paints = (html: string) =>
  [...html.replace(/<defs>[\s\S]*?<\/defs>/g, '').matchAll(/\b(fill|stroke)="([^"]*)"/g)].map(
    (m) => m[2],
  );

const SIZES = [16, 20, 24, 32, 48, 160];

describe('FondealoMark', () => {
  it.each(
    SIZES.flatMap((size) =>
      (['color', 'mono'] as const).map((variant) => [size, variant] as const),
    ),
  )('renders %ipx %s as a token-only svg', (size, variant) => {
    const html = mark({ size, variant });
    expect(html.startsWith('<svg')).toBe(true);
    expect(html).toContain(`width="${size}"`);
    expect(html).toContain(`height="${size}"`);
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(html).not.toMatch(/rgba?\(|hsla?\(/i);
    expect(html).not.toMatch(/Gradient|<filter|<image|<text[\s>]/i);
  });

  it('uses the small-size cut at 20px and below', () => {
    expect(mark({ size: 16 })).toContain('viewBox="0 0 16 16"');
    expect(mark({ size: 20 })).toContain('viewBox="0 0 16 16"');
    expect(mark({ size: 24 })).toContain('viewBox="0 0 48 48"');
  });

  it('is decorative by default', () => {
    const html = mark();
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).not.toContain('role=');
    expect(html).not.toContain('<title');
  });

  it('becomes a labelled image when titled', () => {
    const html = mark({ title: 'Fondealo' });
    expect(html).toContain('role="img"');
    expect(html).toMatch(/<title id="([^"]+)">Fondealo<\/title>/);
    const id = html.match(/<title id="([^"]+)">/)?.[1];
    expect(html).toContain(`aria-labelledby="${id}"`);
    expect(html).not.toContain('aria-hidden');
  });

  it('colour variant paints with theme tokens', () => {
    const html = mark({ size: 48 });
    for (const cls of ['fill-mark-body', 'fill-brand-fill', 'stroke-orbit'])
      expect(html).toContain(cls);
    expect(paints(html).every((p) => p === 'none')).toBe(true);
  });

  it.each([16, 48])('mono variant (%ipx) paints in currentColor only', (size) => {
    const html = mark({ size, variant: 'mono' });
    // No token classes on any shape: colour comes from currentColor alone.
    expect(html).not.toMatch(/<(?!svg)[a-z]+[^>]*\sclass="/);
    const used = paints(html);
    expect(used).toContain('currentColor');
    expect(used.every((p) => p === 'currentColor' || p === 'none')).toBe(true);
  });

  it('keeps mask ids unique per instance', () => {
    const html = renderToStaticMarkup(
      createElement('div', null, createElement(FondealoMark), createElement(FondealoMark)),
    );
    const ids = [...html.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('FondealoLogo', () => {
  it('pairs the mark with the brand wordmark', () => {
    const html = logo({ className: 'text-ink', priority: true });
    expect(html).toContain('class="inline-flex shrink-0 items-center text-ink"');
    expect(html).toContain('<svg');
    expect(html).toContain('font-brand');
    expect(html).toContain('>Fondealo</span>');
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('passes the variant through to the mark', () => {
    expect(logo({ variant: 'mono' })).not.toContain('fill-mark-body');
  });
});

// Optional: dump the markup for a visual check outside the repo.
const previewDir = process.env.MARK_PREVIEW_DIR;
if (previewDir) {
  mkdirSync(previewDir, { recursive: true });
  const out: Record<string, string> = {};
  for (const size of [16, 24, 32, 48, 96, 200]) {
    out[`color-${size}`] = mark({ size });
    out[`mono-${size}`] = mark({ size, variant: 'mono' });
  }
  for (const size of [24, 40]) {
    out[`logo-color-${size}`] = logo({ size });
    out[`logo-mono-${size}`] = logo({ size, variant: 'mono' });
  }
  writeFileSync(join(previewDir, 'markup.json'), JSON.stringify(out, null, 2));
}
