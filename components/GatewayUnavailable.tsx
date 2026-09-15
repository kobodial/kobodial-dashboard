import { GATEWAY_URL } from "@/lib/gateway";

/**
 * Shown wherever a page needed gateway data and could not get it. The
 * brief called for this explicitly: a clear unavailable state rather
 * than a blank page or a spinner that never resolves.
 *
 * It names the URL that was tried and what to check, because the usual
 * cause is configuration — a gateway that isn't running, or
 * NEXT_PUBLIC_GATEWAY_API_URL pointing somewhere else — and that is
 * fixable by whoever is looking at the screen.
 */
export function GatewayUnavailable({ detail }: { detail?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8">
      <h2 className="text-sm font-semibold text-red-900">Gateway unavailable</h2>
      <p className="mt-1 max-w-2xl text-sm text-red-800">
        This dashboard is a read-only view over kobodial-gateway, and that service did not respond.
        No data can be shown until it does — nothing is wrong with the wallets themselves, which
        live on-chain.
      </p>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-red-900">Tried:</dt>
          <dd className="font-mono text-xs break-all text-red-800">{GATEWAY_URL}</dd>
        </div>
        {detail ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-red-900">Detail:</dt>
            <dd className="text-red-800">{detail}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-4 text-sm text-red-800">
        Check that the gateway is running and that{" "}
        <code className="rounded bg-red-100 px-1 py-0.5 text-xs">NEXT_PUBLIC_GATEWAY_API_URL</code>{" "}
        points at it.
      </p>
    </div>
  );
}
