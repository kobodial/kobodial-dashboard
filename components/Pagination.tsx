import Link from "next/link";

/**
 * Pagination over the gateway's list endpoints, which report how many
 * rows match the request as well as returning the page itself.
 *
 * That total is what makes the position honest: "Showing 26-50 of 143"
 * rather than the old inference, where the end of the list was guessed
 * from receiving a short page and Next stayed enabled on a final page
 * that happened to be full.
 *
 * When a filter is active the total counts the filtered set, so an empty
 * view reads as "0 of 0" — nothing matched — rather than looking like
 * rows are being withheld.
 */
export function Pagination({
  basePath,
  offset,
  limit,
  count,
  total,
  extraParams = {},
}: {
  basePath: string;
  offset: number;
  limit: number;
  /** Rows on this page. */
  count: number;
  /** Rows matching the request across all pages. */
  total: number;
  extraParams?: Record<string, string | undefined>;
}) {
  const buildHref = (nextOffset: number) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (nextOffset > 0) params.set("offset", String(nextOffset));
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
    return `${basePath}?${params.toString()}`;
  };

  const hasPrev = offset > 0;
  const hasNext = offset + count < total;
  const first = count === 0 ? 0 : offset + 1;
  const last = offset + count;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));

  const linkClass =
    "border-ink-200 text-ink-700 hover:bg-ink-100 rounded-md border bg-white px-3 py-1.5 text-sm font-medium transition-colors";
  const disabledClass =
    "border-ink-200 text-ink-300 cursor-not-allowed rounded-md border bg-white px-3 py-1.5 text-sm font-medium";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-ink-500 text-sm">
        {total === 0
          ? "No matching rows"
          : `Showing ${first}–${last} of ${total} · page ${page} of ${pages}`}
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Link href={buildHref(Math.max(0, offset - limit))} className={linkClass}>
            ← Previous
          </Link>
        ) : (
          <span className={disabledClass}>← Previous</span>
        )}
        {hasNext ? (
          <Link href={buildHref(offset + limit)} className={linkClass}>
            Next →
          </Link>
        ) : (
          <span className={disabledClass}>Next →</span>
        )}
      </div>
    </div>
  );
}
