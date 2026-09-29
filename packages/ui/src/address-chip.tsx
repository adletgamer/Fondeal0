import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

/** First 4 and last 4 characters: the only truncation Fondealo uses for ledger ids. */
export function truncateAddress(address: string): string {
  return address.length > 10 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export interface AddressChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Full Stellar account (G…) or Soroban contract id (C…). */
  address: string;
  /** Network or contract name shown after the address, e.g. "Testnet", "credit_score". */
  tag?: ReactNode;
}

/**
 * A wallet or contract identity on screen: truncated 4…4 in the ledger face,
 * the full id in the title. Contracts (C…) get a round identicon, accounts a
 * square one. Renders a button so the consumer can attach copy / log-out.
 */
export function AddressChip({ address, tag, className, title, ...props }: AddressChipProps) {
  const isContract = address.startsWith('C');
  return (
    <button
      type="button"
      title={title ?? address}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-brand-line bg-brand-soft py-1.5 pl-1.5 pr-3 font-mono text-[13px] font-medium leading-5 text-brand-text transition-colors hover:border-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'h-5 w-5 shrink-0',
          isContract
            ? 'rounded-full bg-[conic-gradient(from_45deg,rgb(var(--info-text)),rgb(var(--holo)),rgb(var(--info-text)))]'
            : 'rounded-md bg-[conic-gradient(from_90deg,rgb(var(--brand-fill)),rgb(var(--gold-fill)),rgb(var(--holo)),rgb(var(--brand-fill)))]',
        )}
      />
      <span>{truncateAddress(address)}</span>
      {tag ? (
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
          {tag}
        </span>
      ) : null}
    </button>
  );
}
