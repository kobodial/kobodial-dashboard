import {
  fetchBalances,
  fetchTransactions,
  fetchWallets,
  GatewayUnavailableError,
  type BalanceResult,
} from "@/lib/gateway";
import type { Transaction, Wallet } from "@/lib/types";
import { GatewayUnavailable } from "@/components/GatewayUnavailable";
import { Pagination } from "@/components/Pagination";
import { WalletTable } from "@/components/WalletTable";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 25;

/** Clamps to the same 1–200 bounds the gateway enforces, so a hand-edited URL can't 400 the page. */
function parsePaging(params: { limit?: string; offset?: string }) {
  const limit = Math.min(Math.max(Number(params.limit) || DEFAULT_LIMIT, 1), 200);
  const offset = Math.max(Number(params.offset) || 0, 0);
  return { limit, offset };
}

export default async function WalletsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; offset?: string }>;
}) {
  const { limit, offset } = parsePaging(await searchParams);

  let wallets: Wallet[] = [];
  let transactions: Transaction[] = [];
  let balances = new Map<string, BalanceResult>();
  let total = 0;
  let failure: string | undefined;

  try {
    // Transactions come along to derive each wallet's last activity —
    // the gateway's /wallets has no such field.
    const [walletPage, transactionPage] = await Promise.all([
      fetchWallets({ limit, offset }),
      fetchTransactions({ limit: 200 }),
    ]);
    wallets = walletPage.rows;
    total = walletPage.total;
    transactions = transactionPage.rows;
    // Balances are a per-wallet read against the chain, fetched only for
    // the wallets actually on this page. Failures are captured per wallet
    // rather than thrown, so one bad lookup does not blank the table.
    balances = await fetchBalances(wallets.map((w) => w.phoneHash));
  } catch (err) {
    failure = err instanceof GatewayUnavailableError ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Wallets</h1>
        <p className="text-ink-500 mt-1 text-sm">Phone hashes registered through this gateway.</p>
      </div>

      {failure ? (
        <GatewayUnavailable detail={failure} />
      ) : (
        <>
          <WalletTable wallets={wallets} transactions={transactions} balances={balances} />
          <Pagination
            basePath="/wallets"
            offset={offset}
            limit={limit}
            count={wallets.length}
            total={total}
          />
        </>
      )}
    </div>
  );
}
