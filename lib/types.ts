/**
 * The shapes kobodial-gateway actually returns, mirrored from its
 * src/db/schema.ts. Every identifier here is a SHA-256 hex digest — the
 * gateway never stores or serves a raw phone number, so there is nothing
 * to mask on this side that wasn't already hashed on that one.
 */

export type TransactionKind = "register" | "fund" | "send" | "cash_out" | "change_pin";
export type TransactionStatus = "success" | "failed";

/**
 * A wallet as the gateway knows it.
 *
 * Note what is absent: there is no balance field. Balances live on-chain
 * in the KoboDial contract, and the gateway deliberately does not cache
 * them — its wallets table is only an index of which phone hashes were
 * registered through it. The dashboard therefore cannot show a balance
 * without the gateway growing an endpoint that reads the contract; see
 * the note in components/WalletTable.tsx.
 */
export interface Wallet {
  id: number;
  phoneHash: string;
  /** ISO 8601 — when this wallet was registered through the gateway. */
  createdAt: string;
}

export interface Transaction {
  id: number;
  kind: TransactionKind;
  /** The acting wallet: sender on a send, the subject on every other kind. */
  fromPhoneHash: string | null;
  /** Only set on a send — the recipient. */
  toPhoneHash: string | null;
  /** Decimal string, not a number: contract amounts are i128 and exceed Number.MAX_SAFE_INTEGER. */
  amount: string | null;
  status: TransactionStatus;
  /** The contract's error variant name when status is "failed" — InvalidPin, InvalidNonce, ... */
  errorCode: string | null;
  /** Stellar transaction hash, when the attempt reached submission. */
  txHash: string | null;
  createdAt: string;
}

export interface GatewayHealth {
  status: string;
  error?: string;
}

/** A cash-in/cash-out agent. See lib/agents.ts — this is a dashboard-side stub. */
export interface Agent {
  id: string;
  name: string;
  /** Where the agent operates — a town, market or kiosk name. */
  location: string;
  /** E.164, the agent's own contact number. Agents are staff, not wallet users. */
  phone: string;
  createdAt: string;
}
