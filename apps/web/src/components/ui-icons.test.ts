import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as ui from '@fondealo/ui';
import { ICONS, type IconProps } from '@fondealo/ui';

type Icon = (p: IconProps) => unknown;
const icons = Object.entries(ICONS) as [string, Icon][];
const render = (C: Icon, props: IconProps = {}) =>
  renderToStaticMarkup(createElement(C as never, props as never));

describe('@fondealo/ui product icons', () => {
  it('lists every exported Icon* component in ICONS, once', () => {
    const exported = Object.keys(ui)
      .filter((name) => /^Icon[A-Z]/.test(name))
      .sort();
    const names = icons.map(([name]) => name);
    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort()).toEqual(exported);
    // No component registered twice under two names.
    expect(new Set(icons.map(([, C]) => C)).size).toBe(icons.length);
    for (const [name, C] of icons) {
      expect((ui as Record<string, unknown>)[name]).toBe(C);
    }
  });

  it('draws a different glyph for every name', () => {
    const markup = icons.map(([, C]) => render(C));
    expect(new Set(markup).size).toBe(markup.length);
  });

  it.each(icons)('%s renders on the house grid in currentColor', (_name, Icon) => {
    const html = render(Icon, { className: 'text-brand-text' });
    expect(html.startsWith('<svg')).toBe(true);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
    expect(html).toContain('fill="none"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.8"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('stroke-linejoin="round"');
    expect(html).toContain('class="text-brand-text"');
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(html).not.toMatch(/rgba?\(|hsla?\(/i);
    // Any explicit paint is currentColor or none.
    for (const [, value] of html.matchAll(/(?:fill|stroke)="([^"]*)"/g)) {
      expect(['currentColor', 'none']).toContain(value);
    }
  });

  it.each(icons)('%s is decorative by default', (_name, Icon) => {
    const html = render(Icon);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).not.toContain('role=');
    expect(html).not.toContain('<title>');
  });

  it.each(icons)('%s is a labelled image when titled', (_name, Icon) => {
    const html = render(Icon, { title: 'Pasaporte de empresa' });
    expect(html).toContain('role="img"');
    expect(html).toContain('<title>Pasaporte de empresa</title>');
    expect(html).not.toContain('aria-hidden');
  });

  it('passes size and other svg props through', () => {
    const html = render(ui.IconPassport, { width: 48, height: 48, 'aria-label': 'x' } as IconProps);
    expect(html).toContain('width="48"');
    expect(html).toContain('height="48"');
  });
});

// Optional: dump the markup for a visual check outside the repo.
const previewDir = process.env.ICONS_PREVIEW_DIR;
if (previewDir) {
  mkdirSync(previewDir, { recursive: true });
  const markup = Object.fromEntries(icons.map(([name, Icon]) => [name, render(Icon)]));
  writeFileSync(join(previewDir, 'markup.json'), JSON.stringify(markup, null, 2));
}
