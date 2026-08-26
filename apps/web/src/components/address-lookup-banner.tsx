import { Button } from '@fondealo/ui';

/**
 * There's no wallet session yet (SEP-10 is docs/product-v2.md Prompt 1, not
 * built here), so pages that are conceptually "your dashboard" resolve
 * identity from a `?address=` query param instead. A plain GET form needs no
 * client JS. When no address is given, the page shows labeled demo data
 * instead of guessing whose data to show.
 */
export function AddressLookupBanner({
  address,
  action,
  placeholderLabel = 'business',
}: {
  address?: string;
  action: string;
  placeholderLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-slate-600">
        {address ? (
          <>
            Showing data for <span className="font-mono text-slate-800">{address}</span>.
          </>
        ) : (
          <>
            No wallet session yet — showing demo data. Paste your Stellar address to see your real{' '}
            {placeholderLabel}.
          </>
        )}
      </p>
      <form action={action} method="get" className="flex gap-2">
        <input
          name="address"
          defaultValue={address}
          placeholder="G…"
          className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-64"
        />
        <Button type="submit" variant="outline" size="sm">
          {address ? 'Switch' : 'View mine'}
        </Button>
      </form>
    </div>
  );
}
