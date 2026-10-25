import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import * as art from './index';

type Icon = (p: art.PictoProps) => unknown;
const icons = Object.entries(art as Record<string, unknown>).filter(
  (entry): entry is [string, Icon] => typeof entry[1] === 'function',
);
const render = (C: Icon, props: art.PictoProps = {}) =>
  renderToStaticMarkup(createElement(C as never, props as never));

describe('landing pictograms', () => {
  it('exports the full set', () => {
    expect(icons.map(([name]) => name).sort()).toEqual(
      [
        'PictoAccelerator',
        'PictoAudience',
        'PictoChoose',
        'PictoFile',
        'PictoFund',
        'PictoLender',
        'PictoNotLoan',
        'PictoRegister',
        'PictoShare',
        'PictoTestMode',
        'TopicAbout',
        'TopicData',
        'TopicMype',
        'TopicStartup',
      ].sort(),
    );
  });

  it.each(icons)('%s renders a decorative, themeable svg', (_name, Icon) => {
    const html = render(Icon, { className: 'text-brand-text', size: 48 });
    expect(html.startsWith('<svg')).toBe(true);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('width="48"');
    expect(html).toContain('class="text-brand-text"');
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(html).not.toMatch(/#/);
    expect(html).not.toMatch(/rgba?\(/i);
    expect(html).not.toMatch(/<text[\s>]/i);
    expect(html).not.toMatch(/Gradient|<filter|<image/i);
  });

  it('keeps motion to at most three icons, gated on reduced motion', () => {
    const animated = icons.filter(([, Icon]) => /@keyframes/.test(render(Icon)));
    expect(animated.length).toBeLessThanOrEqual(3);
    for (const [, Icon] of animated) {
      expect(render(Icon)).toContain('prefers-reduced-motion: no-preference');
    }
  });
});

// Optional: dump the markup for a visual check outside the repo.
const previewDir = process.env.ART_PREVIEW_DIR;
if (previewDir) {
  mkdirSync(previewDir, { recursive: true });
  const markup = Object.fromEntries(icons.map(([name, Icon]) => [name, render(Icon)]));
  writeFileSync(join(previewDir, 'markup.json'), JSON.stringify(markup, null, 2));
}
