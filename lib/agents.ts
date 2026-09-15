/**
 * Client-side validation for the agent form.
 *
 * The gateway is the authority — it revalidates every field and owns the
 * duplicate check — but validating here too gives the user an immediate
 * error on an empty or malformed field without a round trip. The form must
 * still render whatever the gateway rejects, since a client pass does not
 * mean the gateway will accept.
 *
 * Real agent storage lives on the gateway now (GET/POST/PATCH /agents); the
 * dashboard reads and writes it through lib/gateway.ts and keeps no agent
 * state of its own.
 */

export interface NewAgentInput {
  name: string;
  location: string;
  phone: string;
}

export type AgentValidationError = { field: keyof NewAgentInput; message: string };

/** E.164, the same shape the gateway requires of any phone number. */
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
