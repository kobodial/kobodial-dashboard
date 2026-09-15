import type { Transaction } from "@/lib/types";
import {
  formatAmount,
  formatRelative,
  formatTimestamp,
  kindLabel,
  truncateHash,
} from "@/lib/format";
import { EmptyState } from "./EmptyState";
import { StatusPill } from "./StatusPill";

/** Stellar Expert link for a transaction hash, so an operator can verify a claim on-chain. */
function explorerUrl(txHash: string): string {
  return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}

const KIND_STYLES: Record<string, string> = {
  send: "bg-blue-50 text-blue-800 ring-blue-200",
  fund: "bg-brand-50 text-brand-700 ring-brand-500/20",
  cash_out: "bg-amber-50 text-amber-900 ring-amber-200",
  register: "bg-ink-100 text-ink-700 ring-ink-200",
  change_pin: "bg-ink-100 text-ink-700 ring-ink-200",
};

function KindTag({ kind }: { kind: string }) {
  const style = KIND_STYLES[kind] ?? "bg-ink-100 text-ink-700 ring-ink-200";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {kindLabel(kind)}
    </span>
  );
}

export function TransactionFeed({
  transactions,
  emptyHint,
}: {
  transactions: Transaction[];
  emptyHint?: string;
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions to show"
        hint={
          emptyHint ??
          "Every contract call the gateway attempts is recorded here — successful or not."
        }
      />
    );
  }

  return (
    <div className="border-ink-200 overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full text-sm">
        <thead className="border-ink-200 text-ink-500 border-b text-left text-xs tracking-wide uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              From
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              To
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Amount
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              When
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Tx
            </th>
          </tr>
        </thead>
        <tbody className="divide-ink-100 divide-y">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-ink-50/60">
              <td className="px-4 py-3">
                <KindTag kind={tx.kind} />
              </td>
              <td className="px-4 py-3">
                {tx.fromPhoneHash ? (
                  <span className="font-mono text-xs" title={tx.fromPhoneHash}>
                    {truncateHash(tx.fromPhoneHash, 6, 4)}
                  </span>
                ) : (
                  <span className="text-ink-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                {tx.toPhoneHash ? (
                  <span className="font-mono text-xs" title={tx.toPhoneHash}>
                    {truncateHash(tx.toPhoneHash, 6, 4)}
                  </span>
                ) : (
                  <span className="text-ink-300">—</span>
                )}
              </td>
              <td className="tabular px-4 py-3 text-right font-medium">
                {formatAmount(tx.amount)}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={tx.status} errorCode={tx.errorCode} />
              </td>
              <td className="tabular text-ink-700 px-4 py-3" title={formatTimestamp(tx.createdAt)}>
                {formatRelative(tx.createdAt)}
              </td>
              <td className="px-4 py-3">
                {tx.txHash ? (
                  <a
                    href={explorerUrl(tx.txHash)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand-700 hover:text-brand-600 font-mono text-xs underline underline-offset-2"
                    title={tx.txHash}
                  >
                    {truncateHash(tx.txHash, 6, 4)}
                  </a>
                ) : (
                  <span
                    className="text-ink-300"
                    title="This attempt failed before it was submitted"
                  >
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
