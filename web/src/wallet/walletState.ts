// Client-side wallet status (Feature 3).
//
// Mirrors the session.ts pattern: a small reactive module singleton the router
// guard and the header chip read. It is populated from GET /api/wallet/status
// (the authoritative per-user source) and is the basis for the "must set up a
// wallet first" gate. The server still enforces a wallet on every on-chain call;
// this is UX only. It never holds a secret.
import { reactive } from "vue";
import { walletApi, type WalletStatus } from "../api";

export const walletState = reactive<{
  loaded: boolean;
  configured: boolean;
  publicKey: string | null;
  xlmBalance: string | null;
  funded: boolean;
  network: string;
}>({
  loaded: false,
  configured: false,
  publicKey: null,
  xlmBalance: null,
  funded: false,
  network: "",
});

let inflight: Promise<void> | null = null;

function apply(s: WalletStatus): void {
  walletState.configured = s.configured;
  walletState.publicKey = s.publicKey ?? null;
  walletState.xlmBalance = s.xlmBalance ?? null;
  walletState.funded = s.funded ?? false;
  walletState.network = s.network;
  walletState.loaded = true;
}

/**
 * Load wallet status, caching after the first success. `force` re-fetches (after
 * create/import/replace/funding). On failure `loaded` stays false so the gate
 * fails OPEN (doesn't lock the user out of a UX redirect) - the server is the
 * real gate. Concurrent callers share one in-flight request.
 */
export async function loadWalletStatus(force = false): Promise<void> {
  if (walletState.loaded && !force) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      apply(await walletApi.status());
    } catch {
      /* leave loaded=false; a later navigation retries */
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Forget cached status (on logout / user switch) so the next load re-fetches. */
export function resetWalletState(): void {
  walletState.loaded = false;
  walletState.configured = false;
  walletState.publicKey = null;
  walletState.xlmBalance = null;
  walletState.funded = false;
  walletState.network = "";
}
