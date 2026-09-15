import type { Transaction, Wallet } from "@/lib/types";
import type { BalanceResult } from "@/lib/gateway";
import { formatAmount, formatRelative, formatTimestamp, truncateHash } from "@/lib/format";
import { EmptyState } from "./EmptyState";

/**
 * Finds each wallet's most recent activity from the transaction feed.
 *
 * The gateway's /wallets has no last-activity field, so rather than
 * leave the column blank this derives it from /transactions, matching
 * on either side of a transfer — a wallet that only ever received money
 * has still been active. It is therefore only as complete as the slice
 * of transactions passed in, which the column header says outright.
 */
function lastActivityByWallet(transactions: Transaction[]): Map<string, string> {
  const latest = new Map<string, string>();
  for (const tx of transactions) {
    for (const hash of [tx.fromPhoneHash, tx.toPhoneHash]) {
      if (!hash) continue;
      const seen = latest.get(hash);
      if (!seen || tx.createdAt > seen) latest.set(hash, tx.createdAt);
    }
  }
  return latest;
}

/**
 * One balance cell. The balance is read per wallet from the chain, so each
 * has three possible states — a figure, "not found" (the gateway has the
 * wallet indexed but the contract does not know it), or a lookup that
 * failed — and each shows in place without affecting the other rows.
 */
function BalanceCell({ result }: { result?: BalanceResult }) {
  if (!result) {
    return (
      <span className="text-ink-400" title="Balance not loaded">
        —
      </span>
    );
  }
  if ("balance" in result) {
    return <span>{formatAmount(result.balance)}</span>;
  }
  const notFound = result.error === "WalletNotFound";
  return (
    <span
      className="text-ink-400 text-xs"
      title={
        notFound
          ? "Indexed by the gateway, but the contract has no balance for it"
          : `Balance lookup failed: ${result.error}`
      }
    >
      {notFound ? "not on-chain" : "unavailable"}
    </span>
  );
}

export function WalletTable({
  wallets,
  transactions = [],
  balances,
}: {
  wallets: Wallet[];
  transactions?: Transaction[];
  /** Per-wallet balance lookups, keyed by phone hash. Omitted when balances weren't fetched. */
  balances?: Map<string, BalanceResult>;
}) {
  if (wallets.length === 0) {
    return (
      <EmptyState
        title="No wallets registered through this gateway yet"
        hint="A wallet appears here once someone registers through the USSD menu. Wallets created directly against the contract, or through a different gateway instance, won't be listed — this table is the gateway's own record, not the chain's."
      />
    );
  }

  const lastActivity = lastActivityByWallet(transactions);

  return (
    <div className="border-ink-200 overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-ink-200 text-ink-500 border-b text-left text-xs tracking-wide uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Phone hash
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Balance
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Last activity
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Registered
            </th>
          </tr>
        </thead>
        <tbody className="divide-ink-100 divide-y">
          {wallets.map((wallet) => {
            const active = lastActivity.get(wallet.phoneHash);
            return (
              <tr key={wallet.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  <span className="tabular font-mono text-xs" title={wallet.phoneHash}>
                    {truncateHash(wallet.phoneHash)}
                  </span>
                </td>
                <td className="tabular px-4 py-3">
                  <BalanceCell result={balances?.get(wallet.phoneHash)} />
                </td>
                <td className="tabular px-4 py-3">
                  {active ? (
                    <span title={formatTimestamp(active)}>{formatRelative(active)}</span>
                  ) : (
                    <span className="text-ink-500">No recent activity</span>
                  )}
                </td>
                <td className="tabular text-ink-700 px-4 py-3">
                  {formatTimestamp(wallet.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="border-ink-100 text-ink-500 border-t px-4 py-3 text-xs">
        Phone hashes are SHA-256 digests — the gateway never stores or serves a raw phone number, so
        there is no number here to reveal. Balances are read per wallet from the KoboDial contract
        at load time, so a slow or unreachable lookup shows in its own cell rather than blanking the
        table; last activity is derived from the transactions loaded on this page.
      </p>
    </div>
  );
}
