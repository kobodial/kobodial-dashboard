import { describe, it, expect } from "vitest";
import { fetchWallets, GatewayUnavailableError, type GatewayFailure } from "@/lib/gateway";

/**
 * How a failed gateway call is classified, because the classification is what
 * the reader sees. A gateway waking from idle is a wait; a broken one is not;
 * and telling someone to investigate when they should just reload is the
 * failure mode this guards against.
 *
 * The hosted gateway sleeps after about fifteen minutes and answers 502 or 503
 * while it starts, so this is the response a first-time visitor to a demo link
 * most often gets.
 */
async function reasonFor(response: Response | Error): Promise<GatewayFailure> {
  const fetchFn = (() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response)) as never;
  const original = globalThis.fetch;
  globalThis.fetch = fetchFn;
  try {
    await fetchWallets();
    throw new Error("expected the call to fail");
  } catch (err) {
    if (!(err instanceof GatewayUnavailableError)) throw err;
    return err.reason;
  } finally {
    globalThis.fetch = original;
  }
}

const json = (status: number) =>
  new Response(JSON.stringify({ error: "x" }), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("gateway failure classification", () => {
  for (const status of [502, 503, 504]) {
    it(`treats ${status} as the gateway waking up, not as a fault`, async () => {
      expect(await reasonFor(json(status))).toBe("timeout");
    });
  }

  for (const status of [400, 404, 418, 500]) {
    it(`treats ${status} as a real error, not a wake-up`, async () => {
      // 500 in particular: an application error is not a cold start, and
      // telling someone to reload would send them in circles.
      expect(await reasonFor(json(status))).toBe("status");
    });
  }

  it("treats an aborted request as the gateway waking up", async () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");
    expect(await reasonFor(timeout)).toBe("timeout");
  });

  it("treats a refused connection as unreachable", async () => {
    expect(await reasonFor(new TypeError("fetch failed"))).toBe("unreachable");
  });

  it("treats an unreadable body as a bad response", async () => {
    const notJson = new Response("<html>nope</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
    expect(await reasonFor(notJson)).toBe("body");
  });
});
