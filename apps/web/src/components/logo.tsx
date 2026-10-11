import Image from 'next/image';

/** Shared wordmark used in the navigation and footer. */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <Image
        src="/orbital-badge.png"
        alt=""
        width={40}
        height={40}
        sizes="40px"
        priority={priority}
        className="h-10 w-10 shrink-0 object-contain"
      />
      <span className="font-display text-lg font-bold tracking-tight">Fondealo</span>
    </span>
  );
}
