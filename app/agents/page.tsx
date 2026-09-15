import { listAgents } from "@/lib/agents";
import { formatTimestamp } from "@/lib/format";
import { AgentForm } from "@/components/AgentForm";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

function StubNotice() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
      <h2 className="text-sm font-semibold text-amber-900">Agents are not stored yet</h2>
      <p className="mt-1 max-w-3xl text-sm text-amber-900">
        kobodial-gateway has no agents endpoint, so this page keeps its list in a scratch file on
        the server. That means it <strong>does not survive a redeploy</strong> — and on a serverless
        host it is wiped on a cold start, with each instance holding its own copy.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-amber-900">
        Registering an agent here is useful for walking through the flow, not for keeping records.
        Real storage belongs on the gateway, alongside the rest of the system&apos;s state.
      </p>
    </div>
  );
}

export default async function AgentsPage() {
  const agents = listAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agents</h1>
        <p className="text-ink-500 mt-1 text-sm">
          Cash-in and cash-out agents — the people who take and hand over physical money.
        </p>
      </div>

      <StubNotice />

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
              hint="Add one with the form. Remember this list is scratch storage and will not survive a redeploy."
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
                      Contact
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
                      <td className="tabular text-ink-700 px-4 py-3">{agent.phone}</td>
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
    </div>
  );
}
