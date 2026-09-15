import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Agent } from "./types";

/**
 * A stand-in store for cash-in/cash-out agents.
 *
 * kobodial-gateway has no agents concept yet — no table, no endpoint —
 * so there is nothing for this dashboard to read or write for real. The
 * brief anticipated that and allowed a stub; this is it, kept entirely
 * inside the dashboard so nothing here pretends the gateway knows about
 * agents when it does not.
 *
 * Two things follow from it being in-process memory, and both are
 * visible in the UI rather than left as a surprise:
 *
 *   - It resets whenever the server restarts, and on a serverless host
 *     every cold start is a restart. Agents added through the form may
 *     be gone minutes later.
 *   - It is per-instance. Two users hitting two instances see two
 *     different lists.
 *
 * The real fix is an agents table and endpoints on the gateway, where
 * the rest of the system's state already lives. Tracked as future scope
 * in the README rather than half-built here.
 */

/*
 * Backed by a JSON file in the OS temp directory.
 *
 * The obvious implementations don't work here. A module-level array
 * gives the POST route handler one instance and the page's server
 * component another, because a production Next build can bundle them
 * separately — the form succeeds, the API lists the agent, and the page
 * insists there are none. Moving the array onto globalThis doesn't fix
 * it either: Next 16 runs route handlers and page components in
 * genuinely separate contexts, so they don't share globals. Both
 * failures only appear in a built app; dev mode shares the instance and
 * looks fine.
 *
 * A file is the smallest thing both contexts can actually agree on. It
 * carries the same caveats as before, which the Agents page states
 * plainly: the temp directory is wiped between deploys and on a
 * serverless cold start, and each instance has its own, so this is a
 * demo of the flow rather than a record of anything. Real storage
 * belongs on the gateway.
 */
const STORE_PATH = join(tmpdir(), "kobodial-dashboard-agents.json");

function readAll(): Agent[] {
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Agent[]) : [];
  } catch {
    // Missing or unreadable file means "no agents yet", which is a
    // normal first-run state rather than an error worth surfacing.
    return [];
  }
}

function writeAll(agents: Agent[]): void {
  writeFileSync(STORE_PATH, JSON.stringify(agents), "utf8");
}

export function listAgents(): Agent[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface NewAgentInput {
  name: string;
  location: string;
  phone: string;
}

export type AgentValidationError = { field: keyof NewAgentInput; message: string };

/** E.164, the same shape the gateway requires of a wallet's phone number. */
const E164 = /^\+[1-9]\d{6,14}$/;

export function validateAgent(input: Partial<NewAgentInput>): AgentValidationError[] {
  const errors: AgentValidationError[] = [];
  if (!input.name?.trim()) {
    errors.push({ field: "name", message: "Name is required" });
  }
  if (!input.location?.trim()) {
    errors.push({ field: "location", message: "Location is required" });
  }
  if (!input.phone?.trim()) {
    errors.push({ field: "phone", message: "Phone number is required" });
  } else if (!E164.test(input.phone.trim())) {
    errors.push({
      field: "phone",
      message: "Use international format, e.g. +2348012345678",
    });
  }
  return errors;
}

export function addAgent(input: NewAgentInput): Agent {
  const agent: Agent = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    location: input.location.trim(),
    phone: input.phone.trim(),
    createdAt: new Date().toISOString(),
  };
  const agents = readAll();
  agents.push(agent);
  writeAll(agents);
  return agent;
}
