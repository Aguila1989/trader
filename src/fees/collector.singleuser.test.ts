import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * SINGLE_USER personal mode hard-disables platform fees: the operator would
 * otherwise be charging himself (at the WORST rate, since the DEFAULT account
 * has no premium row), including against a stale dbo.PlatformSettings fee
 * wallet inherited from a prior multi-tenant deployment. This is a money path,
 * so both directions of the flag are pinned.
 */

const mockConfig = vi.hoisted(() => ({
  singleUser: true,
  network: "testnet",
  horizonUrl: "https://horizon-testnet.stellar.org",
  billing: { feeWalletSeed: "" },
  limits: {},
}));

const billing = vi.hoisted(() => ({
  PLATFORM_KEYS: { feeWalletAddress: "fee_wallet_address" },
  getPlatformSetting: vi.fn(async () => "GSTALEFEEWALLETFROMAPRIORDEPLOYMENTAAAAAAAAAAAAAAAAAAAAA"),
  upsertPlatformSetting: vi.fn(async () => {}),
}));

vi.mock("../config", () => ({ config: mockConfig }));
vi.mock("../db/billingRepo", () => billing);
vi.mock("../db/pool", () => ({ dbReady: () => true }));
// Keep the import graph inert: collector transitively pulls the Horizon client
// + trading store; this test only exercises the fee-wallet decision.
vi.mock("../stellar/client", () => ({ horizon: {} }));
vi.mock("../trading/store", () => ({ store: { log: vi.fn() } }));

const { feeWalletAddress, invalidateFeeWalletCache } = await import("./collector");

beforeEach(() => {
  invalidateFeeWalletCache();
  billing.getPlatformSetting.mockClear();
  mockConfig.singleUser = true;
});

describe("feeWalletAddress - SINGLE_USER hard-off", () => {
  it("returns null even when a fee wallet IS configured in the DB", async () => {
    expect(await feeWalletAddress()).toBeNull();
    // Short-circuits before ever reading PlatformSettings.
    expect(billing.getPlatformSetting).not.toHaveBeenCalled();
  });

  it("stays null on repeated calls (never populates the cache with an address)", async () => {
    expect(await feeWalletAddress()).toBeNull();
    expect(await feeWalletAddress()).toBeNull();
  });

  it("flag OFF: the configured fee wallet is returned unchanged (product behavior)", async () => {
    mockConfig.singleUser = false;
    invalidateFeeWalletCache();
    expect(await feeWalletAddress()).toBe(
      "GSTALEFEEWALLETFROMAPRIORDEPLOYMENTAAAAAAAAAAAAAAAAAAAAA",
    );
    expect(billing.getPlatformSetting).toHaveBeenCalled();
  });
});
