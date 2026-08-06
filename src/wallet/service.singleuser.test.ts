import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * SINGLE_USER personal mode: the wallet STATUS layer must surface the env-key
 * operator wallet (STELLAR_PUBLIC / derived from STELLAR_SECRET) as the active
 * custodial stellar wallet when no dbo.Wallets row exists — otherwise the SPA's
 * wallet-setup gate would permanently redirect and the chip/Receive page would
 * show empty, even though the signing path (stellar/keyProvider.ts) already
 * honors the env fallback. Mirrors service.multichain.test.ts's mock set.
 */

const OPERATOR_ID = "00000000-0000-0000-0000-000000000001";
const ENV_PUB = "GENVOPERATORWALLETPUBLICKEYAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const repo = vi.hoisted(() => ({
  getActiveWallet: vi.fn(async (_chain?: string) => null as unknown),
  getLatestPendingWallet: vi.fn(async () => null),
  insertWallet: vi.fn(async () => {}),
  listActiveWallets: vi.fn(async () => [] as unknown[]),
  setWalletStatus: vi.fn(async () => 1),
}));

const mockConfig = vi.hoisted(() => ({
  network: "testnet",
  chains: ["stellar"],
  nonCustodial: false,
  singleUser: true,
  stellarPublic: "GENVOPERATORWALLETPUBLICKEYAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  stellarSecret: "",
  walletEncryptionKey: "k".repeat(64),
  auth: { lockoutMinutes: 15, maxFailedLogins: 5 },
}));

const adapters = vi.hoisted(() => ({
  stellar: {
    chain: "stellar",
    displayName: "Stellar",
    nativeSymbol: "XLM",
    validatePublicKey: vi.fn((pk: string) => pk.startsWith("G")),
    probeAccount: vi.fn(async () => ({ exists: true, nativeBalance: "5", hasAnyFunds: true })),
    explorerAccountUrl: (pk: string) => `https://explorer.example/stellar/${pk}`,
  },
}));

vi.mock("../db/repo", () => repo);
vi.mock("../db/pool", () => ({ dbReady: () => true }));
vi.mock("../users/context", () => ({
  currentUserId: () => "00000000-0000-0000-0000-000000000001",
  DEFAULT_USER_ID: "00000000-0000-0000-0000-000000000001",
}));
vi.mock("../config", () => ({ config: mockConfig }));
vi.mock("../chains/registry", () => ({
  adapterFor: (chain = "stellar") => {
    if (chain !== "stellar") throw new Error(`No ChainAdapter registered for chain "${chain}".`);
    return adapters.stellar;
  },
  enabledChains: () => [adapters.stellar],
  isChainEnabled: (c: string) => c === "stellar",
  isChainSupported: (c: string) => c === "stellar",
}));
vi.mock("../stellar/client", () => ({ horizon: { loadAccount: vi.fn(async () => { throw { response: { status: 404 } }; }) } }));
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

const { getWalletStatus, getWalletsOverview } = await import("./service");

beforeEach(() => {
  repo.getActiveWallet.mockReset().mockResolvedValue(null);
  repo.listActiveWallets.mockReset().mockResolvedValue([]);
  adapters.stellar.probeAccount
    .mockReset()
    .mockResolvedValue({ exists: true, nativeBalance: "5", hasAnyFunds: true });
  mockConfig.singleUser = true;
  mockConfig.stellarPublic = ENV_PUB;
  mockConfig.stellarSecret = "";
});

describe("getWalletStatus - SINGLE_USER env-wallet fallback", () => {
  it("reports the env wallet as the active custodial wallet when no DB row exists", async () => {
    const s = await getWalletStatus();
    expect(s.configured).toBe(true);
    expect(s.publicKey).toBe(ENV_PUB);
    expect(s.clientSigned).toBe(false);
    // horizon mock 404s -> unfunded, but still configured.
    expect(s.funded).toBe(false);
  });

  it("keeps the DB wallet authoritative when a row DOES exist", async () => {
    repo.getActiveWallet.mockResolvedValue({
      id: "w1",
      chain: "stellar",
      publicKey: "GDBROWWALLET",
      encryptedSecret: "sealed",
    });
    const s = await getWalletStatus();
    expect(s.configured).toBe(true);
    expect(s.publicKey).toBe("GDBROWWALLET");
  });

  it("flag OFF: no DB row stays configured=false (product behavior unchanged)", async () => {
    mockConfig.singleUser = false;
    const s = await getWalletStatus();
    expect(s.configured).toBe(false);
    expect(s.publicKey).toBeUndefined();
  });

  it("no env keys at all: routes to the normal setup flow, never a phantom wallet", async () => {
    mockConfig.stellarPublic = "";
    mockConfig.stellarSecret = "";
    try {
      const s = await getWalletStatus();
      expect(s.configured).toBe(false);
      expect(s.publicKey).toBeUndefined();
    } finally {
      mockConfig.stellarPublic = ENV_PUB;
    }
  });

  it("derives the public key from STELLAR_SECRET when STELLAR_PUBLIC is unset", async () => {
    const { Keypair } = await import("@stellar/stellar-sdk");
    const kp = Keypair.random();
    mockConfig.stellarPublic = "";
    mockConfig.stellarSecret = kp.secret();
    try {
      const s = await getWalletStatus();
      expect(s.configured).toBe(true);
      expect(s.publicKey).toBe(kp.publicKey());
    } finally {
      mockConfig.stellarPublic = ENV_PUB;
      mockConfig.stellarSecret = "";
    }
  });

  it("an invalid STELLAR_SECRET is swallowed (configured=false, no crash)", async () => {
    mockConfig.stellarPublic = "";
    mockConfig.stellarSecret = "not-a-valid-secret";
    try {
      const s = await getWalletStatus();
      expect(s.configured).toBe(false);
    } finally {
      mockConfig.stellarPublic = ENV_PUB;
      mockConfig.stellarSecret = "";
    }
  });
});

describe("getWalletsOverview - SINGLE_USER env-wallet fallback", () => {
  it("surfaces the env wallet on the stellar row, never removable", async () => {
    const rows = await getWalletsOverview();
    const stellar = rows.find((r) => r.chain === "stellar");
    expect(stellar?.configured).toBe(true);
    expect(stellar?.publicKey).toBe(ENV_PUB);
    expect(stellar?.clientSigned).toBe(false);
    expect(stellar?.canRemove).toBe(false);
    expect(stellar?.removeBlockReason).toMatch(/server configuration/i);
    expect(stellar?.funded).toBe(true); // adapter probe: exists=true
  });

  it("flag OFF: the stellar row stays unconfigured without a DB row", async () => {
    mockConfig.singleUser = false;
    const rows = await getWalletsOverview();
    const stellar = rows.find((r) => r.chain === "stellar");
    expect(stellar?.configured).toBe(false);
    expect(stellar?.publicKey).toBeUndefined();
  });
});
