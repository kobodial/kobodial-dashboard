import { fetchTransactions, GatewayUnavailableError } from "@/lib/gateway";
import type { Transaction } from "@/lib/types";
import { GatewayUnavailable } from "@/components/GatewayUnavailable";
import { Pagination } from "@/components/Pagination";
import { TransactionFeed } from "@/components/TransactionFeed";
import { TransactionFilter } from "@/components/TransactionFilter";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;
const KINDS = new Set(["send", "fund", "cash_out", "register", "change_pin"]);

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; offset?: string; kind?: string }>;
}) {
  const params = await searchParams;
  const limit = Math.min(Math.max(Number(params.limit) || DEFAULT_LIMIT, 1), 200);
  const offset = Math.max(Number(params.offset) || 0, 0);
  // An unrecognised kind in the URL is ignored rather than yielding an
  // empty table that looks like "no transactions exist".
  const kind = params.kind && KINDS.has(params.kind) ? params.kind : undefined;

  let transactions: Transaction[] = [];
  let failure: string | undefined;

  try {
    transactions = await fetchTransactions({ limit, offset });
  } catch (err) {
    failure = err instanceof GatewayUnavailableError ? err.message : String(err);
  }

  const visible = kind ? transactions.filter((tx) => tx.kind === kind) : transactions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-ink-500 mt-1 text-sm">
          Every contract call the gateway attempted, successful or not.
        </p>
      </div>

      {failure ? (
        <GatewayUnavailable detail={failure} />
      ) : (
        <>
          <TransactionFilter active={kind} limit={limit} />

          {kind ? (
            <p className="text-ink-500 text-sm">
              Showing {visible.length} of {transactions.length} loaded rows. The gateway&apos;s API
              has no type filter, so this narrows the current page rather than searching all
              history.
            </p>
          ) : null}

          <TransactionFeed transactions={visible} />

          <Pagination
            basePath="/transactions"
            offset={offset}
            limit={limit}
            count={transactions.length}
            extraParams={{ kind }}
          />
        </>
      )}
    </div>
  );
}
