import { FondealoLogo } from './brand/mark';

/** Shared wordmark used in the navigation, footer and app shell. */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <FondealoLogo className={className} priority={priority} />;
}
