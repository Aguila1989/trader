import { describe, it, expect, vi } from "vitest";

// Stub the adapters + config so this test exercises the registry logic ONLY,
// without loading the chain stacks (config/Horizon/RPC) at import time.
vi.mock("./stellar/adapter", () => ({
  stellarAdapter: { chain: "stellar" },
}));
vi.mock("./solana/adapter", () => ({
  solanaAdapter: { chain: "solana" },
}));
vi.mock("../config", () => ({
  config: { chains: ["stellar", "solana"] },
}));

const {
  adapterFor,
  defaultAdapter,
  isChainSupported,
  registeredChains,
  enabledChains,
  isChainEnabled,
} = await import("./registry");

describe("chain adapter registry", () => {
  it("resolves adapters by chain (and defaults to stellar)", () => {
    expect(adapterFor("stellar").chain).toBe("stellar");
    expect(adapterFor("solana").chain).toBe("solana");
    expect(adapterFor().chain).toBe("stellar");
    expect(defaultAdapter().chain).toBe("stellar");
  });

  it("reports which chains have adapters", () => {
    expect(isChainSupported("stellar")).toBe(true);
    expect(isChainSupported("solana")).toBe(true);
    expect(isChainSupported("hyperliquid")).toBe(false);
    expect(registeredChains()).toEqual(expect.arrayContaining(["stellar", "solana"]));
  });

  it("throws for an unregistered chain", () => {
    expect(() => adapterFor("hyperliquid")).toThrow(/No ChainAdapter registered/);
  });

  it("enabledChains follows the CHAINS config ∩ registered adapters", () => {
    expect(enabledChains().map((a) => a.chain)).toEqual(["stellar", "solana"]);
    expect(isChainEnabled("stellar")).toBe(true);
    expect(isChainEnabled("solana")).toBe(true);
    expect(isChainEnabled("hyperliquid")).toBe(false);
  });
});
