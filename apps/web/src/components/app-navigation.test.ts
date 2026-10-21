import { describe, expect, it } from 'vitest';
import { APP_NAVIGATION, activeAppHref } from './app-navigation';

describe('authenticated navigation', () => {
  it('retains every destination from the Business and Investor tabs', () => {
    expect(APP_NAVIGATION.Business.map(({ href }) => href)).toEqual([
      '/business',
      '/business/new',
      '/business/passport',
      '/business/verify',
      '/business/datos',
    ]);
    expect(APP_NAVIGATION.Investor.map(({ href }) => href)).toEqual([
      '/invest',
      '/invest/market',
      '/invest/positions',
    ]);
  });

  it('keeps a useful active destination on nested loan and opportunity pages', () => {
    expect(activeAppHref('Business', '/business/loans/loan-1')).toBe('/business');
    expect(activeAppHref('Investor', '/invest/opportunity/offer-1')).toBe('/invest/market');
  });

  it('marks every section destination active without selecting its dashboard', () => {
    for (const role of ['Business', 'Investor'] as const) {
      for (const { href } of APP_NAVIGATION[role]) {
        expect(activeAppHref(role, href)).toBe(href);
      }
    }
    expect(activeAppHref('Business', '/business/new/draft')).toBe('/business/new');
  });

  it('never activates a destination from the other role', () => {
    expect(activeAppHref('Business', '/invest/market')).toBeNull();
    expect(activeAppHref('Investor', '/business/new')).toBeNull();
  });
});
