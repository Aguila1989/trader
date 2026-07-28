import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Multi-chain wallet service tests: registerWallet(chain), getWalletsOverview,
 * removeChainWallet (the zero-funds gate). Every collaborator is mocked — this
 * exercises the service's chain routing + gating logic only.
 */

const repo = vi.hoisted(() => ({
  getActiveWallet: vi.fn(async (_chain?: string) => null as unknown),
  getLatestPendingWallet: vi.fn(async () => null),
  insertWallet: vi.fn(async () => {}),
  listActiveWallets: vi.fn(async () => [] as unknown[]),
  setWalletStatus: vi.fn(async () => 1),
}));

const adapters = vi.hoisted(() => {
  const mk = (chain: string, displayName: string, nativeSymbol: string) => ({
    chain,
    displayName,
    nativeSymbol,
    validatePublicKey: vi.fn((pk: string) => pk.startsWith(chain === "stellar" ? "G" : "So")),
    probeAccount: vi.fn(async () => ({ exists: false, nativeBalance: null, hasAnyFunds: false })),
    explorerAccountUrl: (pk: string) => `https://explorer.example/${chain}/${pk}`,
  });
  return { stellar: mk("stellar", "Stellar", "XLM"), solana: mk("solana", "Solana", "SOL") };
});

vi.mock("../db/repo", () => repo);
vi.mock("../db/pool", () => ({ dbReady: () => true }));
vi.mock("../users/context", () => ({ currentUserId: () => "user-1" }));
vi.mock("../config", () => ({
  config: {
    network: "testnet",
    chains: ["stellar", "solana"],
    nonCustodial: true,
    walletEncryptionKey: "k".repeat(64),
    auth: { lockoutMinutes: 15, maxFailedLogins: 5 },
  },
}));
vi.mock("../chains/registry", () => ({
  adapterFor: (chain = "stellar") => {
    const a = adapters[chain as keyof typeof adapters];
    if (!a) throw new Error(`No ChainAdapter registered for chain "${chain}".`);
    return a;
  },
  enabledChains: () => [adapters.stellar, adapters.solana],
  isChainEnabled: (c: string) => c === "stellar" || c === "solana",
  isChainSupported: (c: string) => c === "stellar" || c === "solana",
}));
vi.mock("../stellar/client", () => ({ horizon: {} }));
vi.mock("../crypto/secretBox", () => ({ encryptSecret: vi.fn(), decryptSecret: vi.fn() }));
vi.mock("../auth/store", () => ({
  findUserById: vi.fn(),
  findCredentialByEmail: vi.fn(),
  registerFailedLogin: vi.fn(),
  recordLoginAttempt: vi.fn(),
  recordSuccessfulLogin: vi.fn(),
}));
vi.mock("../users/password", () => ({ verifyPassword: vi.fn() }));
vi.mock("../stellar/market", () => ({ getOpenOffers: vi.fn(async () => []) }));
vi.mock("../stellar/builder", () => ({ buildCancelOfferTransaction: vi.fn() }));
vi.mock("../stellar/signer", () => ({ signAndSubmit: vi.fn() }));
vi.mock("../trading/orchestrator", () => ({ runExclusive: (fn: () => unknown) => fn() }));
vi.mock("../trading/stopLossService", () => ({
  stopLossService: { getActiveStopLosses: () => [], cancelStopLoss: vi.fn() },
}));
vi.mock("../trading/store", () => ({ store: { log: vi.fn() } }));

const { registerWallet, getWalletsOverview, removeChainWallet } = await import("./service");
const { WalletError } = await import("./errors");

const SOL_ADDR = "So11111111111111111111111111111111111111112";

beforeEach(() => {
  repo.getActiveWallet.mockReset().mockResolvedValue(null);
  repo.insertWallet.mockClear();
  repo.setWalletStatus.mockClear().mockResolvedValue(1);
  repo.listActiveWallets.mockReset().mockResolvedValue([]);
  adapters.solana.probeAccount
    .mockReset()
    .mockResolvedValue({ exists: false, nativeBalance: null, hasAnyFunds: false });
  adapters.stellar.probeAccount
    .mockReset()
    .mockResolvedValue({ exists: false, nativeBalance: null, hasAnyFunds: false });
});

describe("registerWallet (multi-chain)", () => {
  it("registers a solana wallet with encryptedSecret null and the chain stored", async () => {
    const out = await registerWallet(SOL_ADDR, "solana");
    expect(out.chain).toBe("solana");
    expect(out.publicKey).toBe(SOL_ADDR);
    expect(out.xlmBalance).toBeNull(); // stellar-only alias stays null
    expect(repo.insertWallet).toHaveBeenCalledWith(
      expect.objectContaining({ chain: "solana", publicKey: SOL_ADDR, encryptedSecret: null, status: "active" }),
    );
  });

  it("rejects a chain the operator has not enabled", async () => {
    await expect(registerWallet(SOL_ADDR, "hyperliquid")).rejects.toMatchObject({ status: 400 });
    expect(repo.insertWallet).not.toHaveBeenCalled();
  });

  it("rejects an address the chain adapter does not validate", async () => {
    await expect(registerWallet("not-an-address", "solana")).rejects.toBeInstanceOf(WalletError);
    expect(repo.insertWallet).not.toHaveBeenCalled();
  });

  it("refuses a second active wallet on the same chain", async () => {
    repo.getActiveWallet.mockResolvedValueOnce({ id: "w1", chain: "solana" });
    await expect(registerWallet(SOL_ADDR, "solana")).rejects.toMatchObject({ status: 409 });
  });
});

describe("removeChainWallet — the zero-funds gate", () => {
  const walletRow = { id: "w9", chain: "solana", publicKey: SOL_ADDR, encryptedSecret: null, status: "active" };

  it("removes an empty wallet (status -> removed, never deleted)", async () => {
    repo.getActiveWallet.mockResolvedValue(walletRow);
    const out = await removeChainWallet("solana");
    expect(out).toEqual({ chain: "solana", removed: true });
    expect(repo.setWalletStatus).toHaveBeenCalledWith("w9", "removed");
  });

  it("refuses (409) while the wallet still holds any funds", async () => {
    repo.getActiveWallet.mockResolvedValue(walletRow);
    adapters.solana.probeAccount.mockResolvedValue({ exists: true, nativeBalance: "0.5", hasAnyFunds: true });
    await expect(removeChainWallet("solana")).rejects.toMatchObject({ status: 409 });
    expect(repo.setWalletStatus).not.toHaveBeenCalled();
  });

  it("fails CLOSED (502) when the balance cannot be verified", async () => {
    repo.getActiveWallet.mockResolvedValue(walletRow);
    adapters.solana.probeAccount.mockRejectedValue(new Error("rpc down"));
    await expect(removeChainWallet("solana")).rejects.toMatchObject({ status: 502 });
    expect(repo.setWalletStatus).not.toHaveBeenCalled();
  });

  it("404s when there is no active wallet on that chain", async () => {
    await expect(removeChainWallet("solana")).rejects.toMatchObject({ status: 404 });
  });

  it("rejects an unknown chain outright", async () => {
    await expect(removeChainWallet("dogechain")).rejects.toMatchObject({ status: 400 });
  });
});

describe("getWalletsOverview", () => {
  it("lists every enabled chain, configured or not, with the remove gate evaluated", async () => {
    repo.listActiveWallets.mockResolvedValue([
      { id: "w1", chain: "stellar", publicKey: "G".padEnd(56, "A"), encryptedSecret: "blob", status: "active" },
    ]);
    adapters.stellar.probeAccount.mockResolvedValue({ exists: true, nativeBalance: "10", hasAnyFunds: true });

    const chains = await getWalletsOverview();
    expect(chains.map((c) => c.chain)).toEqual(["stellar", "solana"]);

    const stellar = chains[0]!;
    expect(stellar.configured).toBe(true);
    expect(stellar.clientSigned).toBe(false);
    expect(stellar.canRemove).toBe(false);
    expect(stellar.removeBlockReason).toMatch(/still holds funds/);

    const solana = chains[1]!;
    expect(solana.configured).toBe(false);
    expect(solana.enabled).toBe(true);
  });

  it("fails the remove gate closed when a probe errors", async () => {
    repo.listActiveWallets.mockResolvedValue([
      { id: "w2", chain: "solana", publicKey: SOL_ADDR, encryptedSecret: null, status: "active" },
    ]);
    adapters.solana.probeAccount.mockRejectedValue(new Error("rpc down"));
    const chains = await getWalletsOverview();
    const solana = chains.find((c) => c.chain === "solana")!;
    expect(solana.canRemove).toBe(false);
    expect(solana.removeBlockReason).toMatch(/unavailable/i);
    expect(solana.clientSigned).toBe(true);
  });
});
