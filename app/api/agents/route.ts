import { NextResponse } from "next/server";
import { validateAgent } from "@/lib/agents";
import { createAgent, fetchAgents, GatewayUnavailableError } from "@/lib/gateway";

/**
 * A same-origin proxy in front of the gateway's /agents endpoint.
 *
 * The registration form is a client component, and the gateway sends no
 * CORS headers, so the browser cannot post to it directly. This route runs
 * on the server, forwards to the gateway, and maps its responses back to
 * the shape the form expects. Every gateway call in this app stays
 * server-side; this is that rule applied to a write.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await fetchAgents({ limit: 200 });
    return NextResponse.json({ agents: rows });
  } catch (err) {
    const status = err instanceof GatewayUnavailableError ? 502 : 500;
    return NextResponse.json({ error: "Could not reach the gateway." }, { status });
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const input = (body ?? {}) as Partial<{ name: string; location: string; phone: string }>;

  // Fail fast on obviously bad input, in the { errors: [...] } shape the
  // form renders per field. The gateway checks again regardless.
  const errors = validateAgent(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  try {
    const result = await createAgent({
      name: input.name as string,
      location: input.location as string,
      phone: input.phone as string,
    });
    if (result.ok) {
      return NextResponse.json({ agent: result.agent }, { status: 201 });
    }
    // A duplicate (409) or a field the gateway rejected that slipped past
    // the client check: surface the gateway's own message.
    return NextResponse.json({ error: result.error }, { status: result.status });
  } catch (err) {
    const status = err instanceof GatewayUnavailableError ? 502 : 500;
    return NextResponse.json(
      { error: "Could not reach the gateway to register the agent." },
      { status },
    );
  }
}
