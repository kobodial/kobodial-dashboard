import { fetchAgents, GatewayUnavailableError } from "@/lib/gateway";
import type { Agent } from "@/lib/types";
import { formatTimestamp, truncateHash } from "@/lib/format";
import { AgentForm } from "@/components/AgentForm";
import { EmptyState } from "@/components/EmptyState";
import { GatewayUnavailable } from "@/components/GatewayUnavailable";

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: Agent["status"] }) {
  const active = status === "active";
  const cls = active
    ? "bg-brand-50 text-brand-700 border-brand-200"
    : "border-ink-200 bg-ink-50 text-ink-500";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {active ? "Active" : "Suspended"}
    </span>
  );
}

export default async function AgentsPage() {
  let agents: Agent[] = [];
  let failure: string | undefined;

  try {
    agents = (await fetchAgents({ limit: 200 })).rows;
  } catch (err) {
    failure = err instanceof GatewayUnavailableError ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agents</h1>
        <p className="text-ink-500 mt-1 text-sm">
          Cash-in and cash-out agents — the people who take and hand over physical money.
        </p>
      </div>

      {failure ? (
        <GatewayUnavailable detail={failure} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Register an agent</h2>
            <AgentForm />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Registered agents</h2>
            {agents.length === 0 ? (
              <EmptyState
                title="No agents registered"
                hint="Add one with the form. Agents are stored by the gateway, alongside the rest of the system's records."
              />
            ) : (
              <div className="border-ink-200 overflow-x-auto rounded-lg border bg-white">
                <table className="min-w-full text-sm">
                  <thead className="border-ink-200 text-ink-500 border-b text-left text-xs tracking-wide uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Location
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Phone hash
                      </th>
                      <th scope="col" className="px-4 py-3 font-medium">
                        Registered
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-ink-100 divide-y">
                    {agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-ink-50/60">
                        <td className="px-4 py-3 font-medium">{agent.name}</td>
                        <td className="text-ink-700 px-4 py-3">{agent.location}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={agent.status} />
                        </td>
                        <td
                          className="tabular text-ink-700 px-4 py-3"
                          title="SHA-256 of the agent's phone number — not a masked number"
                        >
                          {truncateHash(agent.phoneHash)}
                        </td>
                        <td className="tabular text-ink-700 px-4 py-3">
                          {formatTimestamp(agent.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
