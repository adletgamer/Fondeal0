import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/actions/waitlist', () => ({ joinWaitlist: vi.fn() }));
const { WaitlistFormView } = await import('./waitlist-form');

const values = {
  email: 'ana@startup',
  profile: '',
  country: 'Peru',
  companyName: 'Kallpa',
  consent: false,
  interviewOptIn: false,
};
const render = (result: Parameters<typeof WaitlistFormView>[0]['result'], pending = false) =>
  renderToStaticMarkup(
    createElement(WaitlistFormView, { result, pending, values, onChange: () => {} }),
  );

describe('waitlist form', () => {
  it('starts with an enabled submit and no error summary', () => {
    const html = render(null);
    expect(html).not.toContain('role="alert"');
    expect(html).toMatch(
      /<button[^>]*type="submit"(?![^>]*disabled)[^>]*>Unirme a la lista de espera/,
    );
  });

  it('shows a linked error summary, marks invalid fields and keeps typed values', () => {
    const html = render({
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: { email: 'Revisa tu correo.', consent: 'Marca la casilla.' },
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain('href="#waitlist-email"');
    expect(html).toContain('href="#waitlist-consent"');
    expect(html).toMatch(
      /id="waitlist-email"[^>]*aria-invalid="true"|aria-invalid="true"[^>]*id="waitlist-email"/,
    );
    expect(html).toMatch(/id="waitlist-consent"[^>]*aria-invalid="true"/);
    expect(html).toContain('value="ana@startup"');
    expect(html).toContain('value="Kallpa"');
  });

  it('announces a pending submit', () => {
    const html = render(null, true);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('Enviando…');
  });

  it('replaces the form with a persistent success message', () => {
    const html = render({ ok: true, email: 'ana@startup.pe' });
    expect(html).toContain('role="status"');
    expect(html).toContain('ana@startup.pe');
    expect(html).not.toContain('<form');
  });
});
