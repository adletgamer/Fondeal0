import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrandBadge3D, ICON_3D_MAX, ICONS_3D, Icon3D, icon3dSrc, type Icon3DName } from './icon-3d';

const PUBLIC = join(__dirname, '..', '..', '..', 'public');
const names = Object.keys(ICONS_3D) as Icon3DName[];

describe('3D icon tier', () => {
  it('has a WebP file with an alpha channel for every icon and the badge', () => {
    for (const src of [...names.map(icon3dSrc), '/brand/3d/badge.webp']) {
      const file = join(PUBLIC, src);
      expect(existsSync(file), src).toBe(true);
      const head = readFileSync(file).subarray(0, 32);
      expect(head.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(head.subarray(8, 12).toString('ascii')).toBe('WEBP');
      // VP8X header with the alpha flag, or a lossy+ALPH stream.
      expect(head.subarray(12, 16).toString('ascii')).toBe('VP8X');
      expect(head[20]! & 0x10).toBe(0x10);
    }
  });

  it('labels every icon in both locales', () => {
    for (const n of names) {
      expect(ICONS_3D[n].es.length).toBeGreaterThan(0);
      expect(ICONS_3D[n].en.length).toBeGreaterThan(0);
    }
  });

  it('is decorative by default and labelled on request', () => {
    expect(renderToStaticMarkup(createElement(Icon3D, { name: 'share' }))).toContain('alt=""');
    expect(
      renderToStaticMarkup(createElement(Icon3D, { name: 'share', label: 'Compartir' })),
    ).toContain('alt="Compartir"');
    expect(renderToStaticMarkup(createElement(BrandBadge3D))).toContain('alt=""');
  });

  it('caps the size so the ~300px sources stay sharp on 2x screens', () => {
    const html = renderToStaticMarkup(createElement(Icon3D, { name: 'company', size: 400 }));
    expect(html).toContain(`width="${ICON_3D_MAX}"`);
  });
});
