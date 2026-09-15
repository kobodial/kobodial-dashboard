import type { GatewayHealth, Transaction, Wallet } from "./types";

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
