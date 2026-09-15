import Link from "next/link";

/**
 * Pagination over an API that reports no total count. The gateway's list
 * endpoints return a page and nothing else — no total, no "has more" —
 * so this infers the end the only way available: a page shorter than the
 * limit is the last one. That means Next is disabled exactly when a full
 * page happens to be the final page, which costs one empty page at worst
 * and never shows a wrong total.
 */
export function Pagination({
  basePath,
  offset,
  limit,
  count,
  extraParams = {},
}: {
  basePath: string;
  offset: number;
  limit: number;
  count: number;
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
  const hasNext = count === limit;
  const first = count === 0 ? 0 : offset + 1;
  const last = offset + count;

  const linkClass =
    "border-ink-200 text-ink-700 hover:bg-ink-100 rounded-md border bg-white px-3 py-1.5 text-sm font-medium transition-colors";
  const disabledClass =
    "border-ink-200 text-ink-300 cursor-not-allowed rounded-md border bg-white px-3 py-1.5 text-sm font-medium";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-ink-500 text-sm">
        {count === 0 ? "No rows on this page" : `Showing ${first}–${last}`}
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
