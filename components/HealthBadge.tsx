import { fetchHealth } from "@/lib/gateway";

/**
 * Live gateway status. Renders three distinct states rather than two,
 * because "the gateway answered and said it is unhealthy" is a
 * different problem from "the gateway did not answer at all" — the
 * first points at the gateway's database, the second at the network or
 * a stopped process.
 *
 * Each state differs in text and shape as well as colour, so it stays
 * readable where colour alone would not.
 */
export async function HealthBadge() {
  const result = await fetchHealth();

  if (!result.reachable) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 ring-1 ring-red-200 ring-inset"
        title={result.error}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-red-600" />
        Gateway unreachable
      </span>
    );
  }

  const healthy = result.health?.status === "ok";
  if (!healthy) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ring-inset"
        title={result.health?.error}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-amber-500" />
        Gateway degraded
      </span>
    );
  }

  return (
    <span className="ring-brand-500/20 bg-brand-50 text-brand-700 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset">
      <span aria-hidden className="bg-brand-500 size-1.5 rounded-full" />
      Gateway online
    </span>
  );
}
