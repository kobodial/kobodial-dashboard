import type { TransactionStatus } from "@/lib/types";

/**
 * Success/failure for one transaction. A failed row also carries the
 * contract's error variant (InvalidPin, InvalidNonce, ...), because on
 * this system the reason is the useful part: "failed" alone tells an
 * agent nothing they can act on, while "InvalidPin" tells them the
 * customer mistyped and should try again.
 */
export function StatusPill({ status, errorCode }: { status: TransactionStatus; errorCode?: string | null }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-500/20 ring-inset">
        Success
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 ring-1 ring-red-200 ring-inset">
        Failed
      </span>
      {errorCode ? <span className="text-ink-500 text-xs">{errorCode}</span> : null}
    </span>
  );
}
