import { AlertTriangle } from './icons';

/**
 * Plain-language risk disclosure, matching docs/product-v2.md §2's
 * credibility guardrails: this is reputation-*reduced partial* collateral,
 * not uncollateralized lending; collateral is the enforcement mechanism, not
 * cross-border legal recourse; there is no guaranteed return.
 */
export function RiskDisclosure({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 ${className}`}
    >
      <AlertTriangle width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <p className="font-medium">This is not risk-free.</p>
        <p className="text-amber-800">
          Businesses post partial collateral in USDC, sized by their risk band — never full
          collateral, never zero. If a loan defaults, collateral is seized and paid to investors
          first, but a loss beyond the collateral share is borne by investors. Collateral
          enforcement happens on-chain; there is no cross-border legal recourse behind it. No
          return is guaranteed.
        </p>
      </div>
    </div>
  );
}
