import type { ReactNode } from 'react';
import { PrivyProviders } from '@/components/privy-providers';

/**
 * Login and session routes: onboarding, /business, /invest and the design
 * system. The public landing lives in the (public) group, outside this
 * layout, so its first load does not download the Privy SDK.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <PrivyProviders>{children}</PrivyProviders>;
}
