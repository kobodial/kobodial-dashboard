/**
 * Presentation helpers. Everything here is about making operational data
 * scannable — an agent glancing at a table should be able to tell rows
 * apart and spot a failure without reading carefully.
 */

/**
 * Shortens a 64-character hex digest to something a human can compare at
 * a glance, keeping both ends so two different hashes never look alike.
 *
 * This is NOT masking a phone number: the gateway only ever stores and
 * serves SHA-256 digests, so there is no phone number here to hide. The
 * truncation is for legibility, and the UI says so rather than implying
 * a real number is being protected.
 */
export function truncateHash(hash: string, lead = 8, tail = 6): string {
  if (hash.length <= lead + tail + 1) return hash;
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`;
}

/**
 * Formats a contract amount for display. Amounts arrive as decimal
 * strings because they are i128 on-chain and can exceed
 * Number.MAX_SAFE_INTEGER — so this groups digits without ever parsing
 * to a JS number, which would silently round a large value.
 */
export function formatAmount(amount: string | null): string {
  if (amount === null || amount === "") return "—";
  const negative = amount.startsWith("-");
  const digits = negative ? amount.slice(1) : amount;
  if (!/^\d+$/.test(digits)) return amount;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return negative ? `-${grouped}` : grouped;
}

/** Absolute time, for a column where exactness matters more than brevity. */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time, for an activity feed where "how long ago" reads faster than a date. */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;

  const seconds = Math.round((now.getTime() - then.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatTimestamp(iso);
}

/** Human labels for the gateway's transaction kinds. */
export const KIND_LABELS: Record<string, string> = {
  register: "Register",
  fund: "Cash in",
  send: "Send",
  cash_out: "Cash out",
  change_pin: "PIN change",
};

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}
