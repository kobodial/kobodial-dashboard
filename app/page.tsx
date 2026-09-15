import Link from "next/link";
import { fetchTransactions, fetchWallets, GatewayUnavailableError } from "@/lib/gateway";
import { formatAmount } from "@/lib/format";
import type { Transaction, Wallet } from "@/lib/types";
import { GatewayUnavailable } from "@/components/GatewayUnavailable";
import { HealthBadge } from "@/components/HealthBadge";
import { StatCard } from "@/components/StatCard";
import { TransactionFeed } from "@/components/TransactionFeed";

export const dynamic = "force-dynamic";

/**
 * Sums the amounts of successful money-moving transactions.
 *
 * Kept in BigInt the whole way: amounts are i128 on-chain, and adding
 * them as JS numbers would quietly lose precision on large values.
 * register and change_pin move nothing and carry no amount, so they are
 * excluded rather than counted as zero.
 */
function totalVolume(transactions: Transaction[]): bigint {
  let total = 0n;
  for (const tx of transactions) {
    if (tx.status !== "success" || !tx.amount) continue;
    if (tx.kind === "register" || tx.kind === "change_pin") continue;
    try {
      total += BigInt(tx.amount);
    } catch {
      // A non-numeric amount is a gateway bug, not something to crash a
      // dashboard over — skip it and keep the rest of the total honest.
    }
  }
  return total;
}

function Explainer() {
  return (
    <section className="border-ink-200 rounded-lg border bg-white px-6 py-5">
      <h2 className="text-sm font-semibold">Who this is for</h2>
      <p className="text-ink-700 mt-2 max-w-3xl text-sm leading-relaxed">
        This dashboard is for <strong>cash-in/cash-out agents and system operators</strong>. It is
        not the KoboDial product. People who hold KoboDial wallets never see this screen — they use
        a numbered USSD menu on a feature phone, with no app, no smartphone and no private key of
        their own.
      </p>
      <p className="text-ink-700 mt-2 max-w-3xl text-sm leading-relaxed">
        Everything here is read-only. The dashboard shows what{" "}
        <span className="font-medium">kobodial-gateway</span> has recorded; it holds no keys, signs
        nothing, and cannot move anyone&apos;s money. Balances live on-chain in the KoboDial
        contract, and are authorized by a customer&apos;s PIN — never by this tool.
      </p>
    </section>
  );
}

export default async function OverviewPage() {
  let wallets: Wallet[] = [];
  let transactions: Transaction[] = [];
  let failure: string | undefined;

  try {
    [wallets, transactions] = await Promise.all([
      fetchWallets({ limit: 200 }),
      fetchTransactions({ limit: 200 }),
    ]);
  } catch (err) {
    failure = err instanceof GatewayUnavailableError ? err.message : String(err);
  }

  const successful = transactions.filter((tx) => tx.status === "success").length;
  const failed = transactions.length - successful;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          <p className="text-ink-500 mt-1 text-sm">
            Activity recorded by the gateway, newest first.
          </p>
        </div>
        <HealthBadge />
      </div>

      <Explainer />

      {failure ? (
        <GatewayUnavailable detail={failure} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Wallets"
              value={String(wallets.length)}
              hint="Registered through this gateway"
            />
            <StatCard
              label="Transaction volume"
              value={formatAmount(totalVolume(transactions).toString())}
              hint="Successful transfers and cash movements"
            />
            <StatCard label="Successful" value={String(successful)} hint="Recent transactions" />
            <StatCard
              label="Failed"
              value={String(failed)}
              hint={failed > 0 ? "Wrong PIN, stale session, or low balance" : "None recently"}
            />
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <Link
                href="/transactions"
                className="text-brand-700 hover:text-brand-600 text-sm font-medium"
              >
                View all transactions →
              </Link>
            </div>
            <TransactionFeed
              transactions={transactions.slice(0, 10)}
              emptyHint="Once an agent registers a customer or a customer sends money over USSD, it appears here."
            />
          </section>
        </>
      )}
    </div>
  );
}
