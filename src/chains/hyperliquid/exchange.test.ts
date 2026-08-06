import { describe, it, expect, vi } from "vitest";

/**
 * Hermetic tests for the Hyperliquid exchange (write) client. The signing
 * surface (`signL1Action` from ./eip712, `privateKeyToAddress` from
 * ./crypto) is mocked - both are owned by a different builder; the mocks
 * below ARE the signing contract this file depends on. Every fetch is
 * dependency-injected via `fetchImpl` - nothing here ever hits the network
 * or does real cryptographic signing.
 */
const cryptoMock = vi.hoisted(() => ({
  privateKeyToAddress: vi.fn((pk: string) => `0xaddr-${pk.slice(2, 6)}`),
}));
const eip712Mock = vi.hoisted(() => ({
  signL1Action: vi.fn(() => ({ r: "0xr", s: "0xs", v: 27 })),
}));
vi.mock("./crypto", () => cryptoMock);
vi.mock("./eip712", () => eip712Mock);

const {
  buildPlaceOrderAction,
  buildCancelAction,
  buildModifyAction,
  placeOrders,
  cancelOrders,
  modifyOrders,
  signerAddress,
} = await import("./exchange");
const { HttpClientError } = await import("./http");
import type { HyperliquidOrderRequest } from "./exchange";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const baseArgs = { baseUrl: "https://api.example", isMainnet: false, privateKey: "0xkey1234" };

describe("action builders (pure)", () => {
  it("buildPlaceOrderAction shapes a limit ALO order with Hyperliquid's abbreviated field names", () => {
    const order: HyperliquidOrderRequest = {
      assetIndex: 3,
      isBuy: true,
      limitPx: "100.5",
      size: "2",
      tif: "Alo",
      cloid: "0xabc",
    };
    expect(buildPlaceOrderAction([order])).toEqual({
      type: "order",
      orders: [{ a: 3, b: true, p: "100.5", s: "2", r: false, t: { limit: { tif: "Alo" } }, c: "0xabc" }],
      grouping: "na",
    });
  });

  it("defaults tif to Gtc and reduceOnly to false, and omits cloid when absent", () => {
    const order: HyperliquidOrderRequest = { assetIndex: 1, isBuy: false, limitPx: "1", size: "1" };
    expect(buildPlaceOrderAction([order]).orders[0]).toEqual({
      a: 1,
      b: false,
      p: "1",
      s: "1",
      r: false,
      t: { limit: { tif: "Gtc" } },
    });
  });

  it("buildCancelAction maps assetIndex/orderId onto the wire a/o fields", () => {
    expect(buildCancelAction([{ assetIndex: 2, orderId: 99 }])).toEqual({
      type: "cancel",
      cancels: [{ a: 2, o: 99 }],
    });
  });

  it("buildModifyAction wraps oid + the raw order leg for batchModify", () => {
    const order: HyperliquidOrderRequest = { assetIndex: 0, isBuy: true, limitPx: "5", size: "1" };
    expect(buildModifyAction([{ orderId: 7, order }])).toEqual({
      type: "batchModify",
      modifies: [{ oid: 7, order: { a: 0, b: true, p: "5", s: "1", r: false, t: { limit: { tif: "Gtc" } } } }],
    });
  });
});

describe("signerAddress", () => {
  it("delegates to the mocked privateKeyToAddress", () => {
    expect(signerAddress("0xkey1234")).toBe("0xaddr-key1");
    expect(cryptoMock.privateKeyToAddress).toHaveBeenCalledWith("0xkey1234");
  });
});

describe("placeOrders", () => {
  const order: HyperliquidOrderRequest = {
    assetIndex: 0,
    isBuy: true,
    limitPx: "100",
    size: "1",
    tif: "Alo",
    cloid: "0xc1",
  };

  it("signs the built action and posts the signed envelope to /exchange", async () => {
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.example/exchange");
      const body = JSON.parse(init.body as string);
      expect(body.action).toEqual(buildPlaceOrderAction([order]));
      expect(body.signature).toEqual({ r: "0xr", s: "0xs", v: 27 });
      expect(body.vaultAddress).toBeNull();
      expect(typeof body.nonce).toBe("number");
      return jsonResponse({
        status: "ok",
        response: { type: "order", data: { statuses: [{ resting: { oid: 42 } }] } },
      });
    });
    const out = await placeOrders([order], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ orderId: "42", fill: { filledBase: 0, avgPrice: 100, restingOrderId: "42" } }]);
    expect(eip712Mock.signL1Action).toHaveBeenCalledWith(
      expect.objectContaining({
        action: buildPlaceOrderAction([order]),
        privateKey: "0xkey1234",
        isMainnet: false,
        vaultAddress: null,
      }),
    );
  });

  it("maps a filled status to a Fill with totalSz/avgPx", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        status: "ok",
        response: { type: "order", data: { statuses: [{ filled: { totalSz: "1", avgPx: "99.5", oid: 5 } }] } },
      }),
    );
    const out = await placeOrders([order], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ orderId: "5", fill: { filledBase: 1, avgPrice: 99.5 } }]);
  });

  it("maps a per-leg error status to fill: null, keyed by the caller's cloid", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ status: "ok", response: { type: "order", data: { statuses: [{ error: "insufficient margin" }] } } }),
    );
    const out = await placeOrders([order], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ orderId: "0xc1", fill: null }]);
  });

  it("treats a whole-batch server rejection (status: err) as definitely-not-placed", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ status: "err", response: "bad nonce" }));
    const out = await placeOrders([order], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ orderId: "0xc1", fill: null }]);
  });

  it("never retries a write; a timeout surfaces as an UNKNOWN outcome (fill: null), not a throw", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          });
        }),
    );
    const out = await placeOrders([order], { ...baseArgs, fetchImpl, timeoutMs: 5 });
    expect(fetchImpl).toHaveBeenCalledTimes(1); // no retry on a write, ever
    expect(out).toEqual([{ orderId: "0xc1", fill: null }]);
  });

  it("surfaces a bare network failure (connection refused, DNS, ...) the same way - unknown, not retried", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const out = await placeOrders([order], { ...baseArgs, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(out).toEqual([{ orderId: "0xc1", fill: null }]);
  });

  it("rethrows a non-ambiguous HTTP error (server actually answered outside the ok/err envelope)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "bad request" }, 400));
    await expect(placeOrders([order], { ...baseArgs, fetchImpl })).rejects.toBeInstanceOf(HttpClientError);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // still never retried, but the failure is definite so it's rethrown
  });
});

describe("cancelOrders", () => {
  it("maps a 'success' status to cancelled: true", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ status: "ok", response: { type: "cancel", data: { statuses: ["success"] } } }),
    );
    const out = await cancelOrders([{ assetIndex: 0, orderId: 42 }], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ assetIndex: 0, orderId: 42, cancelled: true }]);
  });

  it("maps any other status to cancelled: false", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ status: "ok", response: { type: "cancel", data: { statuses: [{ error: "unknown oid" }] } } }),
    );
    const out = await cancelOrders([{ assetIndex: 0, orderId: 42 }], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ assetIndex: 0, orderId: 42, cancelled: false }]);
  });

  it("surfaces a network/timeout failure as cancelled: null (unknown), never retried", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const out = await cancelOrders([{ assetIndex: 0, orderId: 42 }], { ...baseArgs, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(out).toEqual([{ assetIndex: 0, orderId: 42, cancelled: null }]);
  });
});

describe("modifyOrders", () => {
  const order: HyperliquidOrderRequest = { assetIndex: 0, isBuy: true, limitPx: "1", size: "1" };

  it("maps a status without an error to modified: true", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ status: "ok", response: { type: "batchModify", data: { statuses: [{ resting: { oid: 7 } }] } } }),
    );
    const out = await modifyOrders([{ orderId: 7, order }], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ orderId: 7, modified: true }]);
  });

  it("maps an error status to modified: false", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ status: "ok", response: { type: "batchModify", data: { statuses: [{ error: "unknown oid" }] } } }),
    );
    const out = await modifyOrders([{ orderId: 7, order }], { ...baseArgs, fetchImpl });
    expect(out).toEqual([{ orderId: 7, modified: false }]);
  });

  it("surfaces an ambiguous write failure as modified: null, never retried", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const out = await modifyOrders([{ orderId: 7, order }], { ...baseArgs, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(out).toEqual([{ orderId: 7, modified: null }]);
  });
});
