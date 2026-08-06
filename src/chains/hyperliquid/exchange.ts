/**
 * Hyperliquid "exchange" REST client (WRITE: place/cancel/modify orders).
 *
 * Every write here is an L1 action: build the action object (pure - see the
 * `build*Action` functions) -> sign it with `signL1Action` (imported from
 * ./crypto, NOT reimplemented here - see the signing contract in the
 * module-level TODO below) -> POST the signed envelope to
 * `{baseUrl}/exchange`.
 *
 * Hyperliquid's matching engine is NOT idempotent on retries, so every call
 * here goes through http.ts's `postJson` with `maxAttempts: 1` - a timeout or
 * network error on a write is surfaced as an UNKNOWN outcome (`fill: null` /
 * `cancelled: null` / `modified: null`), never silently retried. This
 * mirrors src/chains/stellar/reconcile.ts, where a submit timeout (no
 * offerResults) also comes back as `fill === null` so the caller's own
 * assume-full-fill fallback decides what happens next - here the caller
 * should reconcile an unknown place via `getOpenOrders`/`getUserState`
 * (info.ts) keyed by the client order id (`cloid`), which is CALLER-CHOSEN
 * before signing so it can be persisted as the `SignedOrder.handle` BEFORE
 * this module ever touches the network (the same persist-before-submit
 * invariant the Stellar adapter preserves).
 *
 * SIGNING CONTRACT: the plan handed to this builder specified
 * `import { signL1Action, privateKeyToAddress } from "./crypto";` as the
 * agreed seam. The crypto/eip712 builder that actually landed alongside this
 * one split it differently - `privateKeyToAddress` (+ the low-level
 * secp256k1/keccak primitives) live in `./crypto`, while `signL1Action`
 * itself (the HL-specific action-hash + EIP-712 agent wrapper) lives in
 * `./eip712`. Both are read-only files owned by that other builder, so this
 * file imports from wherever each name ACTUALLY resolves rather than
 * duplicating the signing logic - see exchange.test.ts's mock of both
 * modules for the exact contract this file depends on.
 *
 * Config (base URL, network) is passed in per-call via `HyperliquidSubmitArgs`
 * - this module never imports src/config.ts.
 */
import { postJson, HttpClientError } from "./http";
import { privateKeyToAddress } from "./crypto";
import { signL1Action, type MsgpackValue } from "./eip712";
import type { Fill, OrderReceipt } from "../types";

const WRITE_TIMEOUT_MS = 10_000;

export type HyperliquidTif = "Alo" | "Gtc" | "Ioc";

/** One order leg, addressed by Hyperliquid's numeric asset index (from
 *  info.ts's getMeta()) - never by symbol. */
export interface HyperliquidOrderRequest {
  assetIndex: number;
  isBuy: boolean;
  /** Limit price as a decimal string (Hyperliquid wants a string, not a float). */
  limitPx: string;
  /** Order size as a decimal string, already rounded to the asset's szDecimals. */
  size: string;
  reduceOnly?: boolean;
  /** Time-in-force. "Alo" (Add Liquidity Only / post-only) is what the
   *  maker-first strategy uses; defaults to "Gtc" when omitted. */
  tif?: HyperliquidTif;
  /** Client order id (128-bit hex, e.g. "0x" + 32 hex chars) - CALLER-CHOSEN
   *  so it can be persisted as the crash-recovery handle before submit(). */
  cloid?: string;
}

/* ------------------------------------------------------------------ *
 * Action builders - pure, no signing, no network. Unit-test these directly
 * for request shaping.
 * ------------------------------------------------------------------ */

interface RawOrderLeg {
  a: number;
  b: boolean;
  p: string;
  s: string;
  r: boolean;
  t: { limit: { tif: HyperliquidTif } };
  c?: string;
}

function toRawOrderLeg(o: HyperliquidOrderRequest): RawOrderLeg {
  const leg: RawOrderLeg = {
    a: o.assetIndex,
    b: o.isBuy,
    p: o.limitPx,
    s: o.size,
    r: o.reduceOnly ?? false,
    t: { limit: { tif: o.tif ?? "Gtc" } },
  };
  if (o.cloid) leg.c = o.cloid;
  return leg;
}

export interface HyperliquidPlaceOrderAction {
  type: "order";
  orders: RawOrderLeg[];
  grouping: "na";
}

/** Build the `order` action body. Hyperliquid always takes a batch, even for
 *  a single order. */
export function buildPlaceOrderAction(orders: HyperliquidOrderRequest[]): HyperliquidPlaceOrderAction {
  return { type: "order", orders: orders.map(toRawOrderLeg), grouping: "na" };
}

export interface HyperliquidCancelAction {
  type: "cancel";
  cancels: { a: number; o: number }[];
}

/** Build the `cancel` action body. Cancels address a RESTING order by its
 *  numeric `oid` (not the cloid) per the public API. */
export function buildCancelAction(cancels: { assetIndex: number; orderId: number }[]): HyperliquidCancelAction {
  return { type: "cancel", cancels: cancels.map((c) => ({ a: c.assetIndex, o: c.orderId })) };
}

export interface HyperliquidModifyAction {
  type: "batchModify";
  modifies: { oid: number; order: RawOrderLeg }[];
}

/** Build the `batchModify` action body. */
export function buildModifyAction(
  modifies: { orderId: number; order: HyperliquidOrderRequest }[],
): HyperliquidModifyAction {
  return {
    type: "batchModify",
    modifies: modifies.map((m) => ({ oid: m.orderId, order: toRawOrderLeg(m.order) })),
  };
}

/* ------------------------------------------------------------------ *
 * Signing + submit
 * ------------------------------------------------------------------ */

export interface HyperliquidSubmitArgs {
  baseUrl: string;
  isMainnet: boolean;
  privateKey: string;
  /** Sub-account/vault this action trades on behalf of, or omit/null for the
   *  signer's own account. */
  vaultAddress?: string | null;
  /** Dependency-injection seam for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Abort after this many ms. Default 10_000. NOTE: there is deliberately
   *  no `maxAttempts` override here - writes are always exactly 1 attempt
   *  (see the module comment). */
  timeoutMs?: number;
}

interface RawSignature {
  r: string;
  s: string;
  v: number;
}
interface RawExchangeRequest {
  action: unknown;
  nonce: number;
  signature: RawSignature;
  vaultAddress: string | null;
}

// Monotonic nonce: HL rejects a reused nonce as a replay, and two writes fired
// within the same millisecond (a batch loop) would otherwise mint identical
// Date.now() nonces — the second order would be rejected. Also rides through
// small backward clock skew. Process-local is enough: one process signs for
// one key here (fail-closed either way — a duplicate is rejected, never
// double-executed). (Review 2026-08-04, hl-order-submit P2.)
let lastNonce = 0;
function nowNonce(): number {
  const n = Math.max(Date.now(), lastNonce + 1);
  lastNonce = n;
  return n;
}

async function signAndPost<T>(action: unknown, args: HyperliquidSubmitArgs): Promise<T> {
  const nonce = nowNonce();
  const vaultAddress = args.vaultAddress ?? null;
  const signature = signL1Action({
    // The action objects built above (buildPlaceOrderAction/buildCancelAction/
    // buildModifyAction) are plain JSON-shaped data (strings/numbers/booleans/
    // nested objects/arrays only, never `undefined`) - a safe cast to the
    // msgpack-encodable value type ./eip712 signs over.
    action: action as MsgpackValue,
    nonce,
    vaultAddress,
    privateKey: args.privateKey,
    isMainnet: args.isMainnet,
  });
  const body: RawExchangeRequest = { action, nonce, signature, vaultAddress };
  // maxAttempts: 1 - a write is never retried (see the module comment).
  return postJson<T>(`${args.baseUrl}/exchange`, body, {
    timeoutMs: args.timeoutMs ?? WRITE_TIMEOUT_MS,
    maxAttempts: 1,
    fetchImpl: args.fetchImpl,
  });
}

/** The signer's own address - re-exported so callers building `user`/`vault`
 *  fields don't also need to import ./crypto directly. */
export function signerAddress(privateKey: string): string {
  return privateKeyToAddress(privateKey);
}

/** True for a write failure whose outcome is genuinely AMBIGUOUS (the
 *  request may or may not have reached/been processed by the matching
 *  engine) - as opposed to an `http` error where the server actually
 *  answered with a non-2xx rejection, which is safe to treat as "definitely
 *  did not happen".
 *  `invalid-json` counts as ambiguous: http.ts only raises it AFTER a 2xx
 *  response whose body failed to parse (a non-2xx is raised as `http` first),
 *  and a 2xx means the matching engine very likely PROCESSED the order — so
 *  treating it as "definitely didn't happen" and retrying would risk a
 *  double-submit. (Review 2026-08-04, hl-order-submit P2.) */
function isAmbiguousWriteFailure(e: unknown): e is HttpClientError {
  return (
    e instanceof HttpClientError &&
    (e.kind === "timeout" || e.kind === "network" || e.kind === "invalid-json")
  );
}

/* ------------------------------------------------------------------ *
 * Response shapes -> repo types
 * ------------------------------------------------------------------ */

interface RawOrderStatus {
  resting?: { oid: number };
  filled?: { totalSz: string; avgPx: string; oid: number };
  error?: string;
}
interface RawExchangeResponse<D> {
  status: "ok" | "err";
  response: { type: string; data: D } | string;
}
interface RawOrderResponseData {
  statuses: RawOrderStatus[];
}

/**
 * Place one or more orders. Returns one OrderReceipt per leg, in the same
 * order as `orders`. `fill === null` means UNKNOWN when the write itself was
 * ambiguous (timeout/network) - the caller must reconcile out-of-band
 * (getOpenOrders/getUserState by cloid) rather than assume anything; it also
 * legitimately means "resting, nothing matched yet" the same way the Stellar
 * adapter's Fill does (see restingOrderId) when the server DID answer.
 */
export async function placeOrders(
  orders: HyperliquidOrderRequest[],
  args: HyperliquidSubmitArgs,
): Promise<OrderReceipt[]> {
  const action = buildPlaceOrderAction(orders);
  const unknownReceipts = (): OrderReceipt[] => orders.map((o) => ({ orderId: o.cloid ?? "", fill: null }));
  try {
    const res = await signAndPost<RawExchangeResponse<RawOrderResponseData>>(action, args);
    if (res.status !== "ok" || typeof res.response === "string") {
      // The server answered with a hard rejection of the whole batch - not a
      // network/timeout ambiguity, so "definitely did not place" is correct.
      return unknownReceipts();
    }
    const statuses = res.response.data.statuses;
    return orders.map((o, i) => {
      const st = statuses[i];
      const fallbackId = o.cloid ?? "";
      if (!st || st.error) return { orderId: fallbackId, fill: null };
      if (st.filled) {
        const fill: Fill = { filledBase: Number(st.filled.totalSz), avgPrice: Number(st.filled.avgPx) };
        return { orderId: String(st.filled.oid), fill };
      }
      if (st.resting) {
        const fill: Fill = { filledBase: 0, avgPrice: Number(o.limitPx), restingOrderId: String(st.resting.oid) };
        return { orderId: String(st.resting.oid), fill };
      }
      return { orderId: fallbackId, fill: null };
    });
  } catch (e) {
    if (isAmbiguousWriteFailure(e)) return unknownReceipts();
    throw e;
  }
}

export interface HyperliquidCancelResult {
  assetIndex: number;
  orderId: number;
  /** true = confirmed cancelled; false = confirmed NOT cancelled (the server
   *  answered with a rejection); null = UNKNOWN (the write timed out or hit
   *  a network error - do not retry, reconcile via getOpenOrders). */
  cancelled: boolean | null;
}

/** Cancel one or more resting orders by their numeric oid. */
export async function cancelOrders(
  cancels: { assetIndex: number; orderId: number }[],
  args: HyperliquidSubmitArgs,
): Promise<HyperliquidCancelResult[]> {
  const action = buildCancelAction(cancels);
  try {
    const res = await signAndPost<RawExchangeResponse<{ statuses: ("success" | { error: string })[] }>>(action, args);
    if (res.status !== "ok" || typeof res.response === "string") {
      return cancels.map((c) => ({ ...c, cancelled: false }));
    }
    const statuses = res.response.data.statuses;
    return cancels.map((c, i) => ({ ...c, cancelled: statuses[i] === "success" }));
  } catch (e) {
    if (isAmbiguousWriteFailure(e)) return cancels.map((c) => ({ ...c, cancelled: null }));
    throw e;
  }
}

export interface HyperliquidModifyResult {
  orderId: number;
  /** null = UNKNOWN outcome (write timed out/network error) - see `cancelled` above. */
  modified: boolean | null;
}

/** Modify one or more resting orders in place (price/size/tif), addressed by oid. */
export async function modifyOrders(
  modifies: { orderId: number; order: HyperliquidOrderRequest }[],
  args: HyperliquidSubmitArgs,
): Promise<HyperliquidModifyResult[]> {
  const action = buildModifyAction(modifies);
  try {
    const res = await signAndPost<RawExchangeResponse<{ statuses: RawOrderStatus[] }>>(action, args);
    if (res.status !== "ok" || typeof res.response === "string") {
      return modifies.map((m) => ({ orderId: m.orderId, modified: false }));
    }
    const statuses = res.response.data.statuses;
    return modifies.map((m, i) => {
      const st = statuses[i];
      return { orderId: m.orderId, modified: !!st && !st.error };
    });
  } catch (e) {
    if (isAmbiguousWriteFailure(e)) return modifies.map((m) => ({ orderId: m.orderId, modified: null }));
    throw e;
  }
}
