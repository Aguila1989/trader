import { Asset } from "@stellar/stellar-sdk";

/** Parse "XLM"/"native" or "CODE:ISSUER" into a Stellar Asset. */
export function parseAsset(spec: string): Asset {
  const s = spec.trim();
  if (s === "") throw new Error("Empty asset spec");
  if (s.toUpperCase() === "XLM" || s.toLowerCase() === "native") {
    return Asset.native();
  }
  const [code, issuer] = s.split(":");
  if (!code || !issuer) {
    throw new Error(`Invalid asset "${spec}". Use "XLM" or "CODE:ISSUER".`);
  }
  return new Asset(code, issuer);
}

/** Canonical string form: "XLM" or "CODE:ISSUER". */
export function assetToString(asset: Asset): string {
  return asset.isNative() ? "XLM" : `${asset.getCode()}:${asset.getIssuer()}`;
}

/** Validate + normalize a supplied spec to canonical form. Throws if invalid. */
export function canonicalAsset(spec: string): string {
  return assetToString(parseAsset(spec));
}
