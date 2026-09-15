import Link from "next/link";
import { kindLabel } from "@/lib/format";

/**
 * Filter by transaction kind.
 *
 * Implemented as links rather than a client-side control: the filter
 * lives in the URL, so a filtered view can be shared or reloaded, and
 * the page stays a server component with no JavaScript needed to change
 * what it shows.
 *
 * The gateway's list endpoint has no kind parameter, so filtering
 * happens on the rows this page fetched — noted on the page itself,
 * since it means a filter narrows the current page rather than
 * searching all history.
 */
const KINDS = ["send", "fund", "cash_out", "register", "change_pin"] as const;

export function TransactionFilter({ active, limit }: { active?: string; limit: number }) {
  const href = (kind?: string) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (kind) params.set("kind", kind);
    return `/transactions?${params.toString()}`;
  };

  const base = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors border";
  const on = "border-brand-600 bg-brand-600 text-white";
  const off = "border-ink-200 bg-white text-ink-700 hover:bg-ink-100";

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={href()} className={`${base} ${!active ? on : off}`}>
        All
      </Link>
      {KINDS.map((kind) => (
        <Link key={kind} href={href(kind)} className={`${base} ${active === kind ? on : off}`}>
          {kindLabel(kind)}
        </Link>
      ))}
    </div>
  );
}
