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

const agents: Agent[] = [];

export function listAgents(): Agent[] {
  return [...agents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
  agents.push(agent);
  return agent;
}
