"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentValidationError } from "@/lib/agents";

/**
 * Registers a cash-in/cash-out agent.
 *
 * A client component because it is the one genuinely interactive thing
 * in the dashboard — everything else is a server-rendered read. It
 * posts to this app's own /api/agents, not to the gateway, because the
 * gateway has no agents endpoint yet (see lib/agents.ts).
 */
export function AgentForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<AgentValidationError[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const errorFor = (field: string) => errors.find((e) => e.field === field)?.message;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitting(true);
    setErrors([]);
    setFailure(null);
    setSaved(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          location: String(data.get("location") ?? ""),
          phone: String(data.get("phone") ?? ""),
        }),
      });

      if (response.status === 400) {
        const body = (await response.json()) as { errors?: AgentValidationError[] };
        setErrors(body.errors ?? []);
        return;
      }
      if (!response.ok) {
        setFailure(`Could not register the agent (HTTP ${response.status}).`);
        return;
      }

      const body = (await response.json()) as { agent: { name: string } };
      setSaved(body.agent.name);
      form.reset();
      // Re-render the server component list alongside this form.
      router.refresh();
    } catch {
      setFailure("Could not reach the dashboard's API. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass =
    "border-ink-300 focus:border-brand-600 focus:ring-brand-600/20 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2";

  return (
    <form onSubmit={onSubmit} className="border-ink-200 space-y-4 rounded-lg border bg-white p-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Agent name
        </label>
        <input id="name" name="name" className={`${fieldClass} mt-1`} placeholder="Amina Yusuf" />
        {errorFor("name") ? <p className="mt-1 text-xs text-red-700">{errorFor("name")}</p> : null}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium">
          Location
        </label>
        <input
          id="location"
          name="location"
          className={`${fieldClass} mt-1`}
          placeholder="Wuse Market, Abuja"
        />
        {errorFor("location") ? (
          <p className="mt-1 text-xs text-red-700">{errorFor("location")}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Contact number
        </label>
        <input
          id="phone"
          name="phone"
          className={`${fieldClass} mt-1`}
          placeholder="+2348012345678"
          inputMode="tel"
        />
        <p className="text-ink-500 mt-1 text-xs">
          The agent&apos;s own number, for operators to reach them — not a customer wallet.
        </p>
        {errorFor("phone") ? (
          <p className="mt-1 text-xs text-red-700">{errorFor("phone")}</p>
        ) : null}
      </div>

      {failure ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{failure}</p>
      ) : null}
      {saved ? (
        <p className="bg-brand-50 text-brand-700 rounded-md px-3 py-2 text-sm">
          Registered {saved}.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Registering…" : "Register agent"}
      </button>
    </form>
  );
}
