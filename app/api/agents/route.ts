import { NextResponse } from "next/server";
import { addAgent, listAgents, validateAgent } from "@/lib/agents";

// In-process state: never prerender or cache this route.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ agents: listAgents(), stub: true });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const input = (body ?? {}) as Partial<{ name: string; location: string; phone: string }>;
  const errors = validateAgent(input);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const agent = addAgent({
    name: input.name as string,
    location: input.location as string,
    phone: input.phone as string,
  });
  return NextResponse.json({ agent, stub: true }, { status: 201 });
}
