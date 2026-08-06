import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Hyperliquid adapter tests. Every collaborator (config, db/repo, secretBox,
 * users/context, ./info, ./exchange) is mocked - this exercises ONLY the
 * adapter's own routing/gating/payload logic, hermetically (no network, no
 * DB). Mirrors the idiom in src/wallet/service.multichain.test.ts /
 * src/auth/middleware.test.ts.
 */

const configMock = vi.hoisted(() => ({
  network: "testnet" as string,
  walletEncryptionKey: "k".repeat(64),
  hyperliquidApiUrl: "",
  hyperliquidPrivateKey: "",
}));

const repo = vi.hoisted(() => ({
  getActiveWallet: vi.fn(async (_chain?: string) => null as unknown),
}));

const secretBox = vi.hoisted(() => ({
  decryptSecret: vi.fn(),
}));

const userCtx = vi.hoisted(() => ({
  currentUserId: vi.fn(() => "user-1"),
  DEFAULT_USER_ID: "default-user",
}));

const info = vi.hoisted(() => ({
  getMeta: vi.fn(),
  getL2Book: vi.fn(),
  getCandles: vi.fn(),
  getUserState: vi.fn(),
  getOpenOrders: vi.fn(),
}));

const exchange = vi.hoisted(() => ({
  placeOrders: vi.fn(),
  cancelOrders: vi.fn(),
  modifyOrders: vi.fn(),
  signerAddress: vi.fn((pk: string) => `0xaddr-for-${pk.slice(0, 6)}`),
}));

vi.mock("../../config", () => ({ config: configMock }));
// adapter.ts imports summarizeCandles from ../../stellar/market for real
// (reusing its pure indicator math) - that module's own import chain
// constructs a live Horizon client at MODULE LOAD time (src/stellar/client.ts),
// which would need a real config.horizonUrl. Stub the client only;
// summarizeCandles itself runs unmocked (real logic).
vi.mock("../../stellar/client", () => ({ horizon: {} }));
vi.mock("../../db/repo", () => repo);
vi.mock("../../crypto/secretBox", () => secretBox);
vi.mock("../../users/context", () => userCtx);
vi.mock("./info", () => info);
vi.mock("./exchange", () => exchange);

const { hyperliquidAdapter, HyperliquidWalletNotConfiguredError } = await import("./adapter");
const { NotSupportedOnChainError } = await import("../errors");

const WALLET = { publicKey: "0x" + "1".repeat(40), encryptedSecret: "blob" };

const META = [
  { index: 0, name: "BTC", szDecimals: 5, maxLeverage: 50, onlyIsolated: false, isDelisted: false },
  { index: 1, name: "ETH", szDecimals: 4, maxLeverage: 50, onlyIsolated: false, isDelisted: false },
];

function proposal(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "p1",
    createdAt: "",
    updatedAt: "",
    side: "buy",
    baseAsset: "hyperliquid:BTC",
    quoteAsset: "hyperliquid:USDC",
    amount: "1",
    limitPrice: "100",
    maxSlippageBps: 50,
    reason: "test",
    status: "proposed",
    policyViolations: [],
    ...overrides,
  } as import("../../types").TradeProposal;
}

beforeEach(() => {
  configMock.network = "testnet";
  configMock.hyperliquidApiUrl = "";
  configMock.hyperliquidPrivateKey = "";
  repo.getActiveWallet.mockReset().mockResolvedValue(null);
  secretBox.decryptSecret.mockReset().mockReturnValue(Buffer.from("11".repeat(32), "hex"));
  userCtx.currentUserId.mockReset().mockReturnValue("user-1");
  exchange.signerAddress.mockReset().mockImplementation((pk: string) => `0xaddr-for-${pk.slice(0, 6)}`);
  info.getMeta.mockReset().mockResolvedValue(META);
  info.getL2Book.mockReset().mockResolvedValue({ bids: [], asks: [] });
  info.getCandles.mockReset().mockResolvedValue([]);
  info.getUserState.mockReset().mockResolvedValue({ accountValue: 1000, withdrawable: 1000, positions: [] });
  info.getOpenOrders.mockReset().mockResolvedValue([]);
  exchange.placeOrders.mockReset();
  exchange.cancelOrders.mockReset().mockResolvedValue([{ assetIndex: 0, orderId: 1, cancelled: true }]);
  exchange.modifyOrders.mockReset().mockResolvedValue([{ orderId: 1, modified: true }]);
});

describe("wallet basics", () => {
  it("validates EVM 0x-address shape", () => {
    expect(hyperliquidAdapter.validatePublicKey("0x" + "a".repeat(40))).toBe(true);
    expect(hyperliquidAdapter.validatePublicKey("0x" + "a".repeat(39))).toBe(false);
    expect(hyperliquidAdapter.validatePublicKey("GABCDEF")).toBe(false);
  });

  it("parses/formats/detects native USDC", () => {
    const a = hyperliquidAdapter.parseAsset("USDC");
    expect(a).toMatchObject({ chain: "hyperliquid", symbol: "USDC" });
    expect(hyperliquidAdapter.isNative("USDC")).toBe(true);
    expect(hyperliquidAdapter.isNative("hyperliquid:BTC")).toBe(false);
    expect(hyperliquidAdapter.formatAsset(a)).toBe("hyperliquid:USDC");
  });

  it("rejects an asset ref from another chain", () => {
    expect(() => hyperliquidAdapter.parseAsset("XLM")).toThrow(/not a hyperliquid asset/);
  });
});

describe("resolveTradingAccountOrNull / requireTradingAccount", () => {
  it("resolves from dbo.Wallets when a wallet row exists", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    await expect(hyperliquidAdapter.resolveTradingAccountOrNull()).resolves.toBe(WALLET.publicKey);
  });

  it("falls back to the env key ONLY for the default account", async () => {
    userCtx.currentUserId.mockReturnValue("default-user");
    configMock.hyperliquidPrivateKey = "0xsecretkey";
    await expect(hyperliquidAdapter.resolveTradingAccountOrNull()).resolves.toBe("0xaddr-for-0xsecr");
  });

  it("never falls back to the env key for a non-default user", async () => {
    userCtx.currentUserId.mockReturnValue("user-1");
    configMock.hyperliquidPrivateKey = "0xsecretkey";
    await expect(hyperliquidAdapter.resolveTradingAccountOrNull()).resolves.toBeNull();
  });

  it("requireTradingAccount throws HyperliquidWalletNotConfiguredError when unresolved", async () => {
    await expect(hyperliquidAdapter.requireTradingAccount()).rejects.toBeInstanceOf(HyperliquidWalletNotConfiguredError);
  });
});

describe("preflight", () => {
  it("blocks with no_public when no wallet is configured", async () => {
    const res = await hyperliquidAdapter.preflight(proposal());
    expect(res).toMatchObject({ ok: false, code: "no_public" });
  });

  it("blocks with 'account' when userState fails to load", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    info.getUserState.mockRejectedValue(new Error("down"));
    const res = await hyperliquidAdapter.preflight(proposal());
    expect(res).toMatchObject({ ok: false, code: "account" });
  });

  it("blocks bad_input on a non-positive amount/price", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const res = await hyperliquidAdapter.preflight(proposal({ amount: "0" }));
    expect(res).toMatchObject({ ok: false, code: "bad_input" });
  });

  it("blocks bad_input for an unknown market", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const res = await hyperliquidAdapter.preflight(proposal({ baseAsset: "hyperliquid:DOGE" }));
    expect(res).toMatchObject({ ok: false, code: "bad_input" });
    expect(res.reason).toMatch(/unknown hyperliquid market/i);
  });

  it("blocks bad_input when size rounds to zero at the market's size decimals", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    // BTC szDecimals=5 -> 0.000001 rounds to 0.00000 (dust below tick).
    const res = await hyperliquidAdapter.preflight(proposal({ amount: "0.000001", limitPrice: "100000" }));
    expect(res).toMatchObject({ ok: false, code: "bad_input" });
    expect(res.reason).toMatch(/rounds to zero/);
  });

  it("blocks bad_input below the minimum notional", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const res = await hyperliquidAdapter.preflight(proposal({ amount: "0.001", limitPrice: "100" })); // $0.10 notional
    expect(res).toMatchObject({ ok: false, code: "bad_input" });
    expect(res.reason).toMatch(/minimum/);
  });

  it("blocks insufficient_balance when withdrawable margin can't cover the notional", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    info.getUserState.mockResolvedValue({ accountValue: 5, withdrawable: 5, positions: [] });
    const res = await hyperliquidAdapter.preflight(proposal({ amount: "1", limitPrice: "100" })); // $100 notional > $5
    expect(res).toMatchObject({ ok: false, code: "insufficient_balance", assetGiven: "USDC" });
  });

  it("passes when the market exists, size/notional are valid, and margin covers it", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const res = await hyperliquidAdapter.preflight(proposal({ amount: "1", limitPrice: "100" }));
    expect(res).toEqual({ ok: true });
  });
});

describe("prepare -> sign -> submit ordering contract", () => {
  it("generates a cloid at prepare time that sign() returns as the persistable handle BEFORE submit is called", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    exchange.placeOrders.mockResolvedValue([{ orderId: "55", fill: { filledBase: 1, avgPrice: 100 } }]);

    const prepared = await hyperliquidAdapter.prepareOrder(proposal());
    expect(prepared.chain).toBe("hyperliquid");
    expect(prepared.kind).toBe("place");

    const signed = await hyperliquidAdapter.sign(prepared);
    // The handle must exist and be stable BEFORE submit() is ever invoked -
    // and no signing/network work happens inside sign() itself (see the
    // adapter's header comment: HL fuses signing with the POST in submit()).
    expect(signed.handle).toMatch(/^0x[0-9a-f]{32}$/);
    expect(exchange.placeOrders).not.toHaveBeenCalled();
    expect(secretBox.decryptSecret).not.toHaveBeenCalled();

    const receipt = await hyperliquidAdapter.submit(signed);
    expect(exchange.placeOrders).toHaveBeenCalledTimes(1);
    const [orders, args] = exchange.placeOrders.mock.calls[0]!;
    expect(orders[0].cloid).toBe(signed.handle); // cloid embedded in the placed order
    expect(args.privateKey).toMatch(/^0x/);
    expect(receipt).toEqual({ orderId: "55", fill: { filledBase: 1, avgPrice: 100 } });
  });

  it("resolves the asset index from getMeta (BTC=0, ETH=1) and rounds size to szDecimals", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const prepared = await hyperliquidAdapter.prepareOrder(proposal({ baseAsset: "hyperliquid:ETH", amount: "1.23456" }));
    const payload = prepared.payload as { order: { assetIndex: number; size: string } };
    expect(payload.order.assetIndex).toBe(1);
    expect(payload.order.size).toBe("1.2346"); // ETH szDecimals=4
  });

  it("submit-timeout (exchange client throws) propagates - the caller reconciles out-of-band by cloid", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    exchange.placeOrders.mockRejectedValue(new Error("ETIMEDOUT"));
    const prepared = await hyperliquidAdapter.prepareOrder(proposal());
    const signed = await hyperliquidAdapter.sign(prepared);
    await expect(hyperliquidAdapter.submit(signed)).rejects.toThrow("ETIMEDOUT");
  });

  it("falls back to handle/null when placeOrders answers with no receipt", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    exchange.placeOrders.mockResolvedValue([]);
    const prepared = await hyperliquidAdapter.prepareOrder(proposal());
    const signed = await hyperliquidAdapter.sign(prepared);
    const receipt = await hyperliquidAdapter.submit(signed);
    expect(receipt).toEqual({ orderId: signed.handle, fill: null });
  });

  it("a resting (unfilled) order's Fill (from exchange.ts) passes through untouched", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    exchange.placeOrders.mockResolvedValue([{ orderId: "77", fill: { filledBase: 0, avgPrice: 100, restingOrderId: "77" } }]);
    const prepared = await hyperliquidAdapter.prepareOrder(proposal());
    const signed = await hyperliquidAdapter.sign(prepared);
    const receipt = await hyperliquidAdapter.submit(signed);
    expect(receipt.fill).toEqual({ filledBase: 0, avgPrice: 100, restingOrderId: "77" });
  });

  it("cancel/modify orders never carry a fill (submit returns fill:null trivially)", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const prepared = await hyperliquidAdapter.prepareCancel(proposal(), "42");
    const signed = await hyperliquidAdapter.sign(prepared);
    const receipt = await hyperliquidAdapter.submit(signed);
    expect(receipt.fill).toBeNull();
    expect(exchange.cancelOrders).toHaveBeenCalledTimes(1);
    const [cancels] = exchange.cancelOrders.mock.calls[0]!;
    expect(cancels).toEqual([{ assetIndex: 0, orderId: 42 }]);
  });

  it("prepareModify derives isBuy from which leg is the USDC quote", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    const prepared = await hyperliquidAdapter.prepareModify({
      sellAsset: "hyperliquid:USDC",
      buyAsset: "hyperliquid:BTC",
      orderId: "9",
      amount: "0.5",
      price: "200",
    });
    const payload = prepared.payload as { modify: { order: { isBuy: boolean } } };
    expect(payload.modify.order.isBuy).toBe(true);
    await hyperliquidAdapter.submit(await hyperliquidAdapter.sign(prepared));
    expect(exchange.modifyOrders).toHaveBeenCalledTimes(1);
  });

  it("sign() throws NotSupportedOnChainError at submit-time for a client-signed (non-custodial) wallet", async () => {
    repo.getActiveWallet.mockResolvedValue({ publicKey: WALLET.publicKey, encryptedSecret: null });
    const prepared = await hyperliquidAdapter.prepareOrder(proposal());
    const signed = await hyperliquidAdapter.sign(prepared); // no key resolution happens here
    await expect(hyperliquidAdapter.submit(signed)).rejects.toBeInstanceOf(NotSupportedOnChainError);
  });

  it("submit() decrypts the stored secret only for the call and never persists it", async () => {
    repo.getActiveWallet.mockResolvedValue(WALLET);
    exchange.placeOrders.mockResolvedValue([{ orderId: "1", fill: null }]);
    const seed = Buffer.from("22".repeat(32), "hex");
    secretBox.decryptSecret.mockReturnValue(seed);
    const prepared = await hyperliquidAdapter.prepareOrder(proposal());
    const signed = await hyperliquidAdapter.sign(prepared);
    await hyperliquidAdapter.submit(signed);
    expect(secretBox.decryptSecret).toHaveBeenCalledWith("blob", "user-1", configMock.walletEncryptionKey);
    // The seed buffer must be zeroed after use (never left decrypted in memory).
    expect(seed.every((b) => b === 0)).toBe(true);
  });
});

describe("market reads", () => {
  it("bookLevels passes both sides through unchanged (HL gives base-unit sizes on both sides)", () => {
    const snap = {
      base: "hyperliquid:BTC",
      quote: "hyperliquid:USDC",
      bestBid: 99,
      bestAsk: 101,
      spreadBps: null,
      stats: {} as never,
      stats7d: null,
      bids: [{ price: "99", amount: "2" }],
      asks: [{ price: "101", amount: "3" }],
      recentTrades: [],
      flowBuyPct: null,
    };
    const { bids, asks } = hyperliquidAdapter.bookLevels(snap);
    expect(bids).toEqual([{ price: 99, amount: 2 }]);
    expect(asks).toEqual([{ price: 101, amount: 3 }]);
  });

  it("getMarketSnapshot rejects a non-USDC quote", async () => {
    await expect(hyperliquidAdapter.getMarketSnapshot("hyperliquid:BTC", "hyperliquid:ETH")).rejects.toThrow(/USDC-quoted/);
  });

  it("getMarketSnapshot builds bestBid/bestAsk/spread from getL2Book", async () => {
    info.getL2Book.mockResolvedValue({ bids: [{ price: 99, amount: 2 }], asks: [{ price: 101, amount: 3 }] });
    const snap = await hyperliquidAdapter.getMarketSnapshot("hyperliquid:BTC", "USDC");
    expect(snap.bestBid).toBe(99);
    expect(snap.bestAsk).toBe(101);
    expect(snap.spreadBps).toBeCloseTo(((101 - 99) / 101) * 10_000, 5);
  });

  it("getOpenOrders delegates to info.ts (already in repo OpenOrder shape)", async () => {
    info.getOpenOrders.mockResolvedValue([{ id: "5", sellAsset: "USD", buyAsset: "BTC", amount: "1", price: "100" }]);
    const orders = await hyperliquidAdapter.getOpenOrders("0xabc");
    expect(info.getOpenOrders).toHaveBeenCalledWith(expect.any(String), "0xabc");
    expect(orders).toHaveLength(1);
  });
});

describe("fee model", () => {
  it("reports a maker-taker fee model", () => {
    const fee = hyperliquidAdapter.estimateFee();
    expect(fee.model).toBe("maker-taker");
    expect(typeof fee.makerBps).toBe("number");
    expect(typeof fee.takerBps).toBe("number");
  });
});
