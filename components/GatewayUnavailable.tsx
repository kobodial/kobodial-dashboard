import { GATEWAY_URL, type GatewayFailure } from "@/lib/gateway";

/**
 * Shown wherever a page needed gateway data and could not get it. The brief
 * called for this explicitly: a clear unavailable state rather than a blank
 * page or a spinner that never resolves.
 *
 * What it says depends on why. A gateway waking from idle is a wait; a URL
 * pointing at localhost in production is a deploy to redo; an unreachable
 * host is something to go and start. Rendering the same red box for all
 * three tells the reader nothing they can act on.
 */

interface Copy {
  heading: string;
  body: string;
  advice: React.ReactNode;
  tone: "warn" | "error";
}

function copyFor(reason: GatewayFailure): Copy {
  switch (reason) {
    case "timeout":
      return {
        tone: "warn",
        heading: "Gateway is waking up",
        body:
          "The gateway did not answer in time. It runs on an instance that sleeps when idle and " +
          "can take up to a minute to start, so this is expected on the first visit after a quiet " +
          "period.",
        advice: "Reload in a few seconds — it should answer once it is awake.",
      };
    case "misconfigured":
      return {
        tone: "error",
        heading: "Dashboard is misconfigured",
        body:
          "This build is not pointed at a reachable gateway, so no page can load data. This is a " +
          "configuration problem in the deployment, not a fault in the gateway or the wallets.",
        advice: (
          <>
            Set{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 text-xs">
              NEXT_PUBLIC_GATEWAY_API_URL
            </code>{" "}
            and redeploy. The value is inlined at build time, so changing it in the hosting settings
            alone has no effect.
          </>
        ),
      };
    case "status":
    case "body":
      return {
        tone: "error",
        heading: "Gateway answered, but not usably",
        body:
          "The gateway responded with something this dashboard could not read. It is running, so " +
          "this is more likely a version mismatch or an error response than an outage.",
        advice: "Check the gateway's logs for the failing request.",
      };
    default:
      return {
        tone: "error",
        heading: "Gateway unavailable",
        body:
          "This dashboard is a read-only view over kobodial-gateway, and that service did not " +
          "respond. No data can be shown until it does — nothing is wrong with the wallets " +
          "themselves, which live on-chain.",
        advice: (
          <>
            Check that the gateway is running and that{" "}
            <code className="rounded bg-red-100 px-1 py-0.5 text-xs">
              NEXT_PUBLIC_GATEWAY_API_URL
            </code>{" "}
            points at it.
          </>
        ),
      };
  }
}

export function GatewayUnavailable({
  detail,
  reason = "unreachable",
}: {
  detail?: string;
  reason?: GatewayFailure;
}) {
  const copy = copyFor(reason);
  const warn = copy.tone === "warn";

  const border = warn ? "border-amber-200" : "border-red-200";
  const bg = warn ? "bg-amber-50" : "bg-red-50";
  const headingText = warn ? "text-amber-900" : "text-red-900";
  const bodyText = warn ? "text-amber-800" : "text-red-800";

  return (
    <div className={`rounded-lg border ${border} ${bg} px-6 py-8`}>
      <h2 className={`text-sm font-semibold ${headingText}`}>{copy.heading}</h2>
      <p className={`mt-1 max-w-2xl text-sm ${bodyText}`}>{copy.body}</p>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className={`font-medium ${headingText}`}>Tried:</dt>
          <dd className={`font-mono text-xs break-all ${bodyText}`}>{GATEWAY_URL}</dd>
        </div>
        {detail ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className={`font-medium ${headingText}`}>Detail:</dt>
            <dd className={bodyText}>{detail}</dd>
          </div>
        ) : null}
      </dl>
      <p className={`mt-4 text-sm ${bodyText}`}>{copy.advice}</p>
    </div>
  );
}
