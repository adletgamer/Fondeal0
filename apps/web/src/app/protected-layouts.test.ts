import { createElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as null | {
    privyUserId: string;
    stellarAddress: string | null;
    role: 'Business' | 'Investor' | null;
  },
}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock('@/lib/auth/session', () => ({ getSession: async () => state.session }));
vi.mock('@/components/app-shell', () => ({ AppShell: () => null }));
vi.mock('@/components/auth-gate', () => ({ AuthGate: () => null }));

const { default: BusinessLayout } = await import('./business/layout');
const { default: InvestLayout } = await import('./invest/layout');
const content = createElement('div', null, 'Protected content');

beforeEach(() => {
  state.session = null;
});

describe('authenticated layouts', () => {
  it.each([
    ['Business', BusinessLayout],
    ['Investor', InvestLayout],
  ] as const)('renders one %s shell from the verified server role', async (role, layout) => {
    state.session = { privyUserId: 'user', stellarAddress: 'GSTELLAR', role };
    const gate = (await layout({ children: content })) as ReactElement<{ children: ReactElement }>;
    const shell = gate.props.children as ReactElement<{
      role: string;
      address: string;
      children: ReactNode;
    }>;
    expect(shell.props).toMatchObject({ role, address: 'GSTELLAR' });
    expect(shell.props.children).toBe(content);
  });

  it('redirects cross-role access before rendering an app shell', async () => {
    state.session = { privyUserId: 'user', stellarAddress: 'GSTELLAR', role: 'Investor' };
    await expect(BusinessLayout({ children: content })).rejects.toThrow('REDIRECT:/invest');
    state.session.role = 'Business';
    await expect(InvestLayout({ children: content })).rejects.toThrow('REDIRECT:/business');
  });

  it('does not present a role-specific shell for an unresolved server session', async () => {
    const gate = (await BusinessLayout({ children: content })) as ReactElement<{
      children: ReactElement;
    }>;
    expect(gate.props.children).toBe(content);
  });
});
