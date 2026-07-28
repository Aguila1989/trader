import { describe, it, expect } from "vitest";
import {
  parseAssetRef,
  formatAsset,
  chainOf,
  sameAsset,
  STELLAR_DECIMALS,
} from "./assetId";

const USDC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

describe("parseAssetRef — legacy Stellar forms", () => {
  it('parses "XLM" as native stellar', () => {
    expect(parseAssetRef("XLM")).toEqual({ chain: "stellar", symbol: "XLM", decimals: STELLAR_DECIMALS });
  });

  it('parses "native" (any case) as native stellar', () => {
    expect(parseAssetRef("native").symbol).toBe("XLM");
    expect(parseAssetRef("NATIVE").symbol).toBe("XLM");
  });

  it('parses "CODE:ISSUER" as an issued stellar asset', () => {
    expect(parseAssetRef(USDC)).toEqual({
      chain: "stellar",
      symbol: "USDC",
      issuer: ISSUER,
      decimals: STELLAR_DECIMALS,
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseAssetRef("  XLM  ").symbol).toBe("XLM");
  });

  it("throws on empty / malformed", () => {
    expect(() => parseAssetRef("")).toThrow();
    expect(() => parseAssetRef("USDC:")).toThrow();
  });
});

describe("parseAssetRef — new chain-qualified forms", () => {
  it('parses "stellar:XLM" as native stellar', () => {
    expect(parseAssetRef("stellar:XLM")).toEqual({
      chain: "stellar",
      symbol: "XLM",
      decimals: STELLAR_DECIMALS,
    });
  });

  it('parses "stellar:USDC:ISSUER" as an issued stellar asset', () => {
    expect(parseAssetRef(`stellar:${USDC}`)).toEqual({
      chain: "stellar",
      symbol: "USDC",
      issuer: ISSUER,
      decimals: STELLAR_DECIMALS,
    });
  });

  it('parses "hyperliquid:PURR" as a hyperliquid asset', () => {
    const a = parseAssetRef("hyperliquid:PURR");
    expect(a.chain).toBe("hyperliquid");
    expect(a.symbol).toBe("PURR");
    expect(a.contract).toBeUndefined();
  });

  it('parses "hyperliquid:USDC:5" carrying an asset index as contract', () => {
    const a = parseAssetRef("hyperliquid:USDC:5");
    expect(a.chain).toBe("hyperliquid");
    expect(a.symbol).toBe("USDC");
    expect(a.contract).toBe("5");
  });
});

describe("disambiguation — a Stellar code is not a chain prefix", () => {
  it("treats an unknown head as a legacy stellar code", () => {
    // "USDC" is not a known chain, so "USDC:ISSUER" stays legacy stellar.
    expect(parseAssetRef(USDC).chain).toBe("stellar");
    expect(chainOf(USDC)).toBe("stellar");
    expect(chainOf("XLM")).toBe("stellar");
    expect(chainOf("hyperliquid:PURR")).toBe("hyperliquid");
    expect(chainOf("stellar:XLM")).toBe("stellar");
  });
});

describe("formatAsset — round-trips to the legacy Stellar form", () => {
  it("emits bare XLM for native", () => {
    expect(formatAsset(parseAssetRef("XLM"))).toBe("XLM");
    expect(formatAsset(parseAssetRef("stellar:XLM"))).toBe("XLM");
  });

  it('emits "CODE:ISSUER" for an issued stellar asset (byte-identical to storage)', () => {
    expect(formatAsset(parseAssetRef(USDC))).toBe(USDC);
    expect(formatAsset(parseAssetRef(`stellar:${USDC}`))).toBe(USDC);
  });

  it("emits the new form for non-stellar chains", () => {
    expect(formatAsset(parseAssetRef("hyperliquid:PURR"))).toBe("hyperliquid:PURR");
    expect(formatAsset(parseAssetRef("hyperliquid:USDC:5"))).toBe("hyperliquid:USDC:5");
  });
});

describe("sameAsset", () => {
  it("matches legacy and new forms of the same stellar asset", () => {
    expect(sameAsset(USDC, `stellar:${USDC}`)).toBe(true);
    expect(sameAsset("XLM", "stellar:XLM")).toBe(true);
  });

  it("distinguishes different assets / chains", () => {
    expect(sameAsset("XLM", USDC)).toBe(false);
    expect(sameAsset("hyperliquid:PURR", "PURR:" + ISSUER)).toBe(false);
  });

  it("returns false on malformed input rather than throwing", () => {
    expect(sameAsset("", "XLM")).toBe(false);
  });
});
