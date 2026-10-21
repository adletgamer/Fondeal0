import type { SVGProps } from 'react';

/**
 * Fondealo product icons — the platform vocabulary (passport, trust signals,
 * permissioned access…) on the house grid shared with apps/web icons:
 * 24×24 viewBox, 1.8 stroke in currentColor, round caps and joins, live area
 * 2..22, 2px corner radius on rectangles, r=9 for full-size round glyphs.
 *
 * Decorative by default (aria-hidden). Pass `title` when the icon is the only
 * thing that carries the meaning; it then renders role="img" with a <title>.
 */
export type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Glyph({ title, children, ...rest }: IconProps) {
  const a11y = title ? { role: 'img' } : { 'aria-hidden': true };
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/* ───────────────────────────── Vocabulary ───────────────────────────── */

/** Company Passport: a bound booklet with a seal on the cover. */
export function IconPassport(p: IconProps) {
  return (
    <Glyph {...p}>
      <rect x="4.5" y="3" width="15" height="18" rx="2" />
      <path d="M8 3v18" />
      <circle cx="13.75" cy="11.5" r="3.25" />
      <circle cx="13.75" cy="11.5" r="1" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** Trust Signals: three signals converging into one reading. */
export function IconTrustSignals(p: IconProps) {
  return (
    <Glyph {...p}>
      <circle cx="4" cy="5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="4" cy="19" r="1.8" fill="currentColor" stroke="none" />
      <path d="M7.5 6.5L15 12M7.5 12H15M7.5 17.5L15 12M15 12h6" />
    </Glyph>
  );
}

/** Verified Activity: an activity pulse closed by a check. */
export function IconVerifiedActivity(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M2.5 12H5l2.5-6 3 12 2.5-6h1" />
      <path d="M15.5 13.5l2 2 4-4.5" />
    </Glyph>
  );
}

/** Financial Reputation: a stepped track record reaching a star. */
export function IconFinancialReputation(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M3 20.5h4v-4h4v-4h4v-4" />
      <path d="M18.5 2.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </Glyph>
  );
}

/** Permissioned Access: an eye over a switch — you decide who sees what. */
export function IconPermissionedAccess(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M3.5 7.5c2-3 4.8-4.5 8.5-4.5s6.5 1.5 8.5 4.5c-2 3-4.8 4.5-8.5 4.5s-6.5-1.5-8.5-4.5z" />
      <circle cx="12" cy="7.5" r="2" />
      <rect x="5" y="15" width="14" height="6" rx="3" />
      <circle cx="16" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </Glyph>
  );
}

/** Financing Network: one central node linked to three. */
export function IconFinancingNetwork(p: IconProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="13" r="3" />
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 6.5V10M9.7 14.95l-3.2 2.75M14.3 14.95l3.2 2.75" />
    </Glyph>
  );
}

/* ───────────────────────────── Passport parts ───────────────────────────── */

/** Identity: the registered company — a building beside its record lines. */
export function IconIdentity(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M3 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M6 8h3M6 12h3M6 16h3M2 21h11" />
      <path d="M15.5 9h5.5M15.5 13h5.5M15.5 17h3.5" />
    </Glyph>
  );
}

/** Activity: the operating pulse of the company. */
export function IconActivity(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M2 12h3l2.5-6 3.5 12 3-9 2 3h6" />
    </Glyph>
  );
}

/** Payments: a receipt with money flowing in and out. */
export function IconPayments(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-2.33-1.5-2.33 1.5L12 19.5 9.67 21l-2.34-1.5L5 21z" />
      <path d="M8.5 8.5h7m-2-2l2 2-2 2" />
      <path d="M15.5 14h-7m2-2l-2 2 2 2" />
    </Glyph>
  );
}

/* ───────────────────────────── Recipients ───────────────────────────── */

/** Fund: capital that grows — a sprout rising from a coin. */
export function IconFund(p: IconProps) {
  return (
    <Glyph {...p}>
      <ellipse cx="12" cy="17" rx="7" ry="3" />
      <path d="M5 17v1.5c0 1.7 3.1 3 7 3s7-1.3 7-3V17" />
      <path d="M12 14V8" />
      <path d="M12 9.5c0-3 2-5 5.5-5 0 3-2 5-5.5 5zM12 11c0-2.5-1.7-4-4.5-4 0 2.5 1.7 4 4.5 4z" />
    </Glyph>
  );
}

/** Lender: a bank front with a coin in the pediment. */
export function IconLender(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M12 3l8.5 4.5h-17L12 3z" />
      <path d="M6.5 10.5v7M12 10.5v7M17.5 10.5v7M3.5 20.5h17" />
    </Glyph>
  );
}

/** Accelerator: a rocket on the climb. */
export function IconAccelerator(p: IconProps) {
  return (
    <Glyph {...p}>
      <g transform="rotate(45 12 12)">
        <path d="M12 2.5c2.7 2.2 3.8 5.3 3.8 9v5.5H8.2v-5.5c0-3.7 1.1-6.8 3.8-9z" />
        <circle cx="12" cy="10" r="1.5" />
        <path d="M8.2 13l-3 3.5V20l3-1.5M15.8 13l3 3.5V20l-3-1.5M12 20v1.5" />
      </g>
    </Glyph>
  );
}

/* ───────────────────────────── Access ───────────────────────────── */

/** Share: grant access — the passport goes out. */
export function IconShare(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M15 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
      <circle cx="9" cy="9.5" r="2.75" />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M13 17h8m-3-3l3 3-3 3" />
    </Glyph>
  );
}

/** Revoke: the same passport, access withdrawn. */
export function IconRevoke(p: IconProps) {
  return (
    <Glyph {...p}>
      <path d="M15 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
      <circle cx="9" cy="9.5" r="2.75" />
      <circle cx="9" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M14 14l6 6m0-6l-6 6" />
    </Glyph>
  );
}

/* ───────────────────────────── States ───────────────────────────── */

export function IconLock(p: IconProps) {
  return (
    <Glyph {...p}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5V17" />
    </Glyph>
  );
}

export function IconPending(p: IconProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </Glyph>
  );
}

export function IconChecked(p: IconProps) {
  return (
    <Glyph {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 5-5.5" />
    </Glyph>
  );
}

/** Every product icon by export name, for the specimen page. */
export const ICONS = {
  IconPassport,
  IconTrustSignals,
  IconVerifiedActivity,
  IconFinancialReputation,
  IconPermissionedAccess,
  IconFinancingNetwork,
  IconIdentity,
  IconActivity,
  IconPayments,
  IconFund,
  IconLender,
  IconAccelerator,
  IconShare,
  IconRevoke,
  IconLock,
  IconPending,
  IconChecked,
} as const satisfies Record<string, (p: IconProps) => unknown>;

export type IconName = keyof typeof ICONS;
