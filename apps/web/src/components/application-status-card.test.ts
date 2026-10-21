import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { applicationStatus } from '@/lib/application-status';
import { ApplicationStatusCard } from './application-status-card';

const processing = applicationStatus({
  status: 'Processing',
  legalName: 'Café Andino SAC',
  country: 'Peru',
  sector: 'Food & beverage',
  providerRef: 'sbx_1',
  provider: 'sandbox',
  reviewedAt: null,
  underwritingStatus: null,
  eligible: false,
});

describe('application status card', () => {
  it('marks the current step and always says verification is not financing', () => {
    const html = renderToStaticMarkup(createElement(ApplicationStatusCard, { status: processing }));
    expect(html).toContain('Tu solicitud está en revisión');
    expect(html).toMatch(/aria-current="step"[^>]*>.*Verificación de identidad/s);
    expect(html).toContain('no significa que recibirás financiamiento');
  });

  it('hides the timeline in compact mode and the action when asked', () => {
    const html = renderToStaticMarkup(
      createElement(ApplicationStatusCard, {
        status: applicationStatus(null),
        compact: true,
        showAction: false,
      }),
    );
    expect(html).not.toContain('Etapas de la verificación');
    expect(html).not.toContain('Reintentar');
  });
});
