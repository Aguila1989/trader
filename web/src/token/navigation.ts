// Feature 5: token detail is a real routed page (/token/:assetCode/:assetIssuer).
// Every "open this token" click funnels through goToToken(), which carries the
// ORIGIN in history.state so the page's back button can label itself
// ("← Back to Portfolio" / "Back to Trading" / "Back to Whitelist") and
// router.back() returns to the exact page the user came from - never a
// hardcoded route. Deep links / bookmarks arrive without state and fall back
// to a plain "← Back" that goes home.
import type { Router } from "vue-router";

export type TokenBackContext = "portfolio" | "trading" | "whitelist";

/** "XLM" <-> the reserved issuer segment used for the native asset's URL. */
const NATIVE_SEGMENT = "native";

/** Route params for an asset spec ("XLM" or "CODE:ISSUER"). */
export function tokenRouteParams(asset: string): { assetCode: string; assetIssuer: string } {
  if (asset === "XLM") return { assetCode: "XLM", assetIssuer: NATIVE_SEGMENT };
  const i = asset.indexOf(":");
  if (i < 0) return { assetCode: asset, assetIssuer: NATIVE_SEGMENT };
  return { assetCode: asset.slice(0, i), assetIssuer: asset.slice(i + 1) };
}

/** The asset spec for the current route params (inverse of tokenRouteParams). */
export function assetFromParams(assetCode: string, assetIssuer: string): string {
  if (assetCode === "XLM" || assetIssuer === NATIVE_SEGMENT || assetIssuer === "") return "XLM";
  return `${assetCode}:${assetIssuer}`;
}

/** Navigate to a token's page, recording where the user came from. */
export function goToToken(router: Router, asset: string, from: TokenBackContext): void {
  void router
    .push({ name: "token", params: tokenRouteParams(asset), state: { tokenBack: from } })
    .catch(() => {});
}
