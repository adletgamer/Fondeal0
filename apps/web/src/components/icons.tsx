import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ShieldCheck(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function TrendingUp(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

export function Wallet(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" />
      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H5a2 2 0 0 1-2-2z" />
      <circle cx="16.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Coins(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <ellipse cx="8" cy="6" rx="5" ry="2.5" />
      <path d="M3 6v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V6" />
      <path d="M13 12.2c.6.2 1.3.3 2 .3 2.8 0 5-1.1 5-2.5" />
      <ellipse cx="16" cy="13" rx="5" ry="2.5" />
      <path d="M11 13v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5" />
    </svg>
  );
}

export function FileCheck(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 15l2 2 3.5-3.5" />
    </svg>
  );
}

export function Repeat(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

export function Building(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11" />
      <path d="M8 8h3M8 12h3M8 16h3" />
      <path d="M2 21h20" />
    </svg>
  );
}

export function Landmark(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 21h18" />
      <path d="M4 10h16" />
      <path d="M12 3l8 5H4l8-5z" />
      <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
    </svg>
  );
}

export function ArrowRight(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Sparkle(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
    </svg>
  );
}

export function Layers(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  );
}

export function Lock(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Fondealo wordmark + mark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden>
        <defs>
          <linearGradient id="fondealo-mark" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#fondealo-mark)" />
        <path d="M22 46V18h21v7H30.5v6H41v7H30.5v8H22Z" fill="white" />
        <circle cx="45" cy="40" r="5" fill="#fbbf24" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight">Fondealo</span>
    </span>
  );
}
