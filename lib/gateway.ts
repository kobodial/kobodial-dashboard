import type { Agent, GatewayHealth, Transaction, Wallet } from "./types";

/**
 * Typed client for kobodial-gateway's read-only REST API.
 *
 * Every call runs on the server — from a server component or a route
 * handler — never from the browser. That is deliberate: the gateway
 * sends no CORS headers, so a browser fetching it directly from another
 * origin would be blocked. Rendering server-side sidesteps that
 * entirely, and has the nicer side effect that a page arrives with its
 * data already in the HTML rather than after a spinner.
 */

export const GATEWAY_URL = (
  process.env.NEXT_PUBLIC_GATEWAY_API_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * Raised when the gateway cannot be reached or answers with something
 * unusable. Pages catch this and render an explicit "gateway
 * unavailable" state — never a blank screen or a spinner that never
 * resolves.
 */
export class GatewayUnavailableError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GatewayUnavailableError";
  }
}

/** Requests are given a bounded deadline so an unreachable gateway fails visibly instead of hanging the render. */
const REQUEST_TIMEOUT_MS = 8_000;

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}${path}`, {
      // Operational data: always current, never a cached view of a
      // transaction feed that has since moved on.
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
  } catch (err) {
    throw new GatewayUnavailableError(`Could not reach the gateway at ${GATEWAY_URL}${path}`, err);
  }

  if (!response.ok) {
    throw new GatewayUnavailableError(`Gateway responded ${response.status} for ${path}`);
  }

  try {
    return (await response.json()) as T;
  } catch (err) {
    throw new GatewayUnavailableError(`Gateway returned a non-JSON body for ${path}`, err);
  }
}

export interface Page {
  limit?: number;
  offset?: number;
}

/** Filters the gateway applies server-side, over all history rather than one page. */
export interface TransactionQuery extends Page {
  kind?: string;
  status?: string;
}

/**
 * A page of rows together with how many exist in total.
 *
 * `total` counts every row matching the request's filters, not the rows
 * returned — so a filtered view can say how many matches exist rather
 * than inferring the end of the list from a short page.
 */
export interface PagedResult<T> {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

/**
 * Older gateway builds answered with a bare `{ wallets: [...] }` and no
 * total. Falling back to the row count keeps this client working against
 * one rather than rendering "0 of 0" over a full table — the count is
 * then merely the page size, which is what the old inference gave anyway.
 */
function paged<T>(
  rows: T[] | undefined,
  body: Partial<PagedResult<T>>,
  fallback: Page,
): PagedResult<T> {
  const list = rows ?? [];
  return {
    rows: list,
    total: body.total ?? list.length,
    limit: body.limit ?? fallback.limit ?? list.length,
    offset: body.offset ?? fallback.offset ?? 0,
  };
}

export async function fetchWallets(page: Page = {}): Promise<PagedResult<Wallet>> {
  const body = await getJson<{ wallets: Wallet[] } & Partial<PagedResult<Wallet>>>(
    `/wallets${query({ limit: page.limit, offset: page.offset })}`,
  );
  return paged(body.wallets, body, page);
}

/**
 * One wallet's balance lookup. Resolves for every outcome the table must
 * render differently — a figure, or a reason there isn't one — rather than
 * throwing, so a single failed lookup shows in its own cell instead of
 * blanking the whole page.
 *
 * The balance stays a string end to end: it is an i128 on-chain and would
 * lose precision as a JS number.
 */
export type BalanceResult =
  { phoneHash: string; balance: string } | { phoneHash: string; error: string };

export async function fetchBalance(phoneHash: string): Promise<BalanceResult> {
  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}/wallets/${phoneHash}/balance`, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
  } catch {
    return { phoneHash, error: "unreachable" };
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (response.ok) {
    return { phoneHash, balance: String((body as { balance: string }).balance) };
  }
  const err = (body as { error?: string }).error;
  return { phoneHash, error: err ?? `HTTP ${response.status}` };
}

/**
 * Balances for a page of wallets, fetched with bounded concurrency.
 *
 * A page can hold up to 200 wallets and each balance is its own round trip
 * to the chain. Done serially the page would wait on 200 sequential calls;
 * done all at once it would open 200 sockets and hammer the RPC. A small
 * fixed width is the middle path. When the gateway gains a batch endpoint
 * this becomes a single call — tracked in the gateway's issues.
 */
export async function fetchBalances(
  phoneHashes: string[],
  concurrency = 8,
): Promise<Map<string, BalanceResult>> {
  const results = new Map<string, BalanceResult>();
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < phoneHashes.length) {
      const hash = phoneHashes[cursor++]!;
      results.set(hash, await fetchBalance(hash));
    }
  }
  const width = Math.min(concurrency, phoneHashes.length);
  await Promise.all(Array.from({ length: width }, () => worker()));
  return results;
}

export async function fetchAgents(page: Page = {}): Promise<PagedResult<Agent>> {
  const body = await getJson<{ agents: Agent[] } & Partial<PagedResult<Agent>>>(
    `/agents${query({ limit: page.limit, offset: page.offset })}`,
  );
  return paged(body.agents, body, page);
}

/**
 * The result of trying to register an agent. This resolves rather than
 * throws for the two outcomes the form must show differently — a
 * validation rejection and a duplicate — because they are answers the user
 * needs, not failures. A genuinely unreachable gateway still throws
 * GatewayUnavailableError, like every other call.
 */
export type CreateAgentResult =
  { ok: true; agent: Agent } | { ok: false; status: number; error: string };

export interface NewAgent {
  name: string;
  phone: string;
  location: string;
}

export async function createAgent(input: NewAgent): Promise<CreateAgentResult> {
  let response: Response;
  try {
    response = await fetch(`${GATEWAY_URL}/agents`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(input),
    });
  } catch (err) {
    throw new GatewayUnavailableError(`Could not reach the gateway at ${GATEWAY_URL}/agents`, err);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (response.ok) {
    return { ok: true, agent: (body as { agent: Agent }).agent };
  }

  // The gateway describes a bad field or a duplicate in its error body; pass
  // that through rather than inventing a message, so the form shows what the
  // authoritative validator actually said.
  const detail = extractError(body) ?? `The gateway rejected the agent (HTTP ${response.status}).`;
  return { ok: false, status: response.status, error: detail };
}

/**
 * The gateway returns errors either as a plain string (`{ error: "..." }`)
 * or as an array of zod issues; normalise both to one line for display.
 */
function extractError(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const err = (body as { error?: unknown }).error;
  if (typeof err === "string") return err;
  if (Array.isArray(err)) {
    const messages = err
      .map((issue) => (issue as { message?: string }).message)
      .filter((m): m is string => Boolean(m));
    if (messages.length > 0) return messages.join("; ");
  }
  return undefined;
}

export async function fetchTransactions(
  params: TransactionQuery = {},
): Promise<PagedResult<Transaction>> {
  const body = await getJson<{ transactions: Transaction[] } & Partial<PagedResult<Transaction>>>(
    `/transactions${query({
      limit: params.limit,
      offset: params.offset,
      kind: params.kind,
      status: params.status,
    })}`,
  );
  return paged(body.transactions, body, params);
}

/**
 * Health is the one call that resolves rather than throws when the
 * gateway is down — "unreachable" is itself the answer a health badge
 * needs to display, not an exception it has to handle.
 */
export async function fetchHealth(): Promise<{
  reachable: boolean;
  health?: GatewayHealth;
  error?: string;
}> {
  try {
    const health = await getJson<GatewayHealth>("/health");
    return { reachable: true, health };
  } catch (err) {
    return {
      reachable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
