import { describe, it, expect, vi } from "vitest";
import {
  getMeta,
  getL2Book,
  getCandles,
  getAllMids,
  getFundingRate,
  getPredictedFunding,
  getUserState,
  getOpenOrders,
} from "./info";
import { HttpClientError } from "./http";

/**
 * Hermetic tests for the Hyperliquid info (read) client. Every fetch is
 * dependency-injected via the `fetchImpl` option - nothing here ever hits
 * the network. Covers request shaping, response -> repo-type mapping, and
 * (since http.ts has no test file of its own) the shared retry/timeout
 * behavior exercised through a read call.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("getMeta", () => {
  it("posts {type:'meta'} and maps universe entries to index/szDecimals with defaults", async () => {
    const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.example/info");
      expect(JSON.parse(init.body as string)).toEqual({ type: "meta" });
      return jsonResponse({
        universe: [
          { name: "BTC", szDecimals: 5 },
          { name: "ETH", szDecimals: 4, onlyIsolated: true, maxLeverage: 20, isDelisted: false },
        ],
      });
    });
    const out = await getMeta("https://api.example", { fetchImpl });
    expect(out).toEqual([
      { index: 0, name: "BTC", szDecimals: 5, maxLeverage: null, onlyIsolated: false, isDelisted: false },
      { index: 1, name: "ETH", szDecimals: 4, maxLeverage: 20, onlyIsolated: true, isDelisted: false },
    ]);
  });
});

describe("getL2Book", () => {
  it("converts levels into BookLevel[] with numeric price/amount", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({ type: "l2Book", coin: "BTC", nSigFigs: null, mantissa: null });
      return jsonResponse({
        coin: "BTC",
        time: 1,
        levels: [
          [{ px: "100", sz: "2", n: 1 }],
          [{ px: "101", sz: "3", n: 1 }],
        ],
      });
    });
    const out = await getL2Book("https://api.example", "BTC", { fetchImpl });
    expect(out).toEqual({ bids: [{ price: 100, amount: 2 }], asks: [{ price: 101, amount: 3 }] });
  });
});

describe("getCandles", () => {
  it("maps HL candle fields onto the repo Candle shape", async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(init.body as string)).toEqual({
        type: "candleSnapshot",
        req: { coin: "BTC", interval: "1m", startTime: 0, endTime: 1 },
      });
      return jsonResponse([
        { t: 1700000000000, T: 1700000059999, o: "10", h: "12", l: "9", c: "11", v: "5", n: 3, i: "1m", s: "BTC" },
      ]);
    });
    const out = await getCandles("https://api.example", "BTC", "1m", 0, 1, { fetchImpl });
    expect(out).toEqual([
      { time: new Date(1700000000000).toISOString(), open: 10, high: 12, low: 9, close: 11, baseVolume: 5, tradeCount: 3 },
    ]);
  });
});

describe("getAllMids", () => {
  it("converts the coin->string map into coin->number", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ BTC: "100.5", ETH: "10" }));
    const out = await getAllMids("https://api.example", { fetchImpl });
    expect(out).toEqual({ BTC: 100.5, ETH: 10 });
  });
});

describe("getFundingRate", () => {
  it("finds the coin by name in metaAndAssetCtxs and reads its funding/mark/oracle", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([
        { universe: [{ name: "BTC", szDecimals: 5 }, { name: "ETH", szDecimals: 4 }] },
        [
          { funding: "0.0001", markPx: "101", oraclePx: "100" },
          { funding: "0.0002", markPx: "10.1", oraclePx: "10" },
        ],
      ]),
    );
    const out = await getFundingRate("https://api.example", "ETH", { fetchImpl });
    expect(out).toEqual({ coin: "ETH", fundingRate: 0.0002, markPx: 10.1, oraclePx: 10 });
  });

  it("throws when the coin is not in the universe", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([{ universe: [] }, []]));
    await expect(getFundingRate("https://api.example", "DOGE", { fetchImpl })).rejects.toThrow(/no asset context/i);
  });
});

describe("getPredictedFunding", () => {
  it("picks the HlPerp venue's predicted rate for the coin", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([
        [
          "BTC",
          [
            ["BinPerp", { fundingRate: "0.0005", nextFundingTime: 1 }],
            ["HlPerp", { fundingRate: "0.0003", nextFundingTime: 1 }],
          ],
        ],
      ]),
    );
    const out = await getPredictedFunding("https://api.example", "BTC", { fetchImpl });
    expect(out).toBe(0.0003);
  });

  it("returns null when the coin isn't present in the response", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([]));
    const out = await getPredictedFunding("https://api.example", "DOGE", { fetchImpl });
    expect(out).toBeNull();
  });
});

describe("getUserState", () => {
  it("converts clearinghouseState into accountValue/withdrawable/positions, dropping zero-size legs", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        marginSummary: { accountValue: "1000", totalMarginUsed: "100", totalNtlPos: "500", totalRawUsd: "1000" },
        withdrawable: "900",
        assetPositions: [
          {
            type: "oneWay",
            position: {
              coin: "BTC",
              szi: "0.5",
              entryPx: "100",
              positionValue: "50",
              unrealizedPnl: "5",
              liquidationPx: "80",
            },
          },
          {
            type: "oneWay",
            position: {
              coin: "ETH",
              szi: "0",
              entryPx: null,
              positionValue: "0",
              unrealizedPnl: "0",
              liquidationPx: null,
            },
          },
        ],
      }),
    );
    const out = await getUserState("https://api.example", "0xabc", { fetchImpl });
    expect(out).toEqual({
      accountValue: 1000,
      withdrawable: 900,
      positions: [{ coin: "BTC", size: 0.5, entryPx: 100, positionValue: 50, unrealizedPnl: 5, liquidationPx: 80 }],
    });
  });
});

describe("getOpenOrders", () => {
  it("maps side B/A onto buy/sell against the USD placeholder quote leg", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([
        { coin: "BTC", side: "B", limitPx: "100", sz: "1", oid: 5, timestamp: 1700000000000 },
        { coin: "BTC", side: "A", limitPx: "110", sz: "2", oid: 6, timestamp: 1700000000000 },
      ]),
    );
    const out = await getOpenOrders("https://api.example", "0xabc", { fetchImpl });
    expect(out).toEqual([
      { id: "5", sellAsset: "USD", buyAsset: "BTC", amount: "1", price: "100", lastModified: new Date(1700000000000).toISOString() },
      { id: "6", sellAsset: "BTC", buyAsset: "USD", amount: "2", price: "110", lastModified: new Date(1700000000000).toISOString() },
    ]);
  });
});

describe("retry + timeout behavior (exercised via a read call, since http.ts has no dedicated test file)", () => {
  it("retries a 503 once (with zero backoff) then succeeds", async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls++;
      if (calls === 1) return jsonResponse({ error: "boom" }, 503);
      return jsonResponse({ BTC: "1" });
    });
    const out = await getAllMids("https://api.example", { fetchImpl, maxAttempts: 3, retryBaseMs: 0 });
    expect(calls).toBe(2);
    expect(out).toEqual({ BTC: 1 });
  });

  it("gives up after maxAttempts and throws a retryable HttpClientError", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "boom" }, 503));
    await expect(
      getAllMids("https://api.example", { fetchImpl, maxAttempts: 3, retryBaseMs: 0 }),
    ).rejects.toBeInstanceOf(HttpClientError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-retryable 4xx", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "bad request" }, 400));
    await expect(
      getAllMids("https://api.example", { fetchImpl, maxAttempts: 3, retryBaseMs: 0 }),
    ).rejects.toBeInstanceOf(HttpClientError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("surfaces a timeout as an HttpClientError with kind 'timeout' after the abort fires", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          });
        }),
    );
    await expect(getAllMids("https://api.example", { fetchImpl, timeoutMs: 5, maxAttempts: 1 })).rejects.toMatchObject({
      name: "HttpClientError",
      kind: "timeout",
    });
  });

  it("clamps maxAttempts to the absolute cap instead of retrying forever", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "boom" }, 500));
    await expect(
      getAllMids("https://api.example", { fetchImpl, maxAttempts: 1000, retryBaseMs: 0 }),
    ).rejects.toBeInstanceOf(HttpClientError);
    expect(fetchImpl.mock.calls.length).toBeLessThanOrEqual(5);
  });
});
