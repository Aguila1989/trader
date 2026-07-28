/**
 * Wallet management endpoints (Feature 3). Mounted in server.ts AFTER the auth
 * gate, so every handler runs inside the authenticated user's scope
 * (currentUserId()) - they are absent from PUBLIC_API_PATHS and so are
 * default-deny. No handler ever returns, logs, or echoes a secret key (the one
 * exception is POST /create, which returns the freshly-generated secret ONCE for
 * the user to write down, over their authed TLS session).
 *
 * Error contract: a WalletError carries an intended client status + safe message
 * and is returned verbatim. Anything else is a 5xx and is masked (SEC-25): the
 * real cause is logged server-side, the client gets a generic message.
 */
import { Router, type Request, type Response } from "express";
import { config } from "../config";
import { store } from "../trading/store";
import {
  createWallet,
  confirmWallet,
  importWallet,
  getWalletStatus,
  getWalletsOverview,
  replaceWallet,
  fundViaFriendbot,
  registerWallet,
  removeChainWallet,
} from "./service";
import { WalletError } from "./errors";

/** Map a thrown error to a response. WalletError -> its status; else masked 5xx. */
function fail(res: Response, err: unknown): void {
  if (err instanceof WalletError) {
    if (!res.headersSent) res.status(err.status).json({ error: err.message });
    return;
  }
  store.log("error", `wallet request failed: ${(err as Error)?.message ?? String(err)}`);
  if (!res.headersSent) res.status(500).json({ error: "request failed" });
}

export function createWalletRouter(): Router {
  const router = Router();

  // Status for the header chip + the "must set up a wallet" gate. Public key +
  // balance only - never the secret.
  router.get("/status", async (_req: Request, res: Response) => {
    try {
      res.json(await getWalletStatus());
    } catch (err) {
      fail(res, err);
    }
  });

  // OPTION A step 1: generate a new keypair. Returns { publicKey, secret } ONCE.
  router.post("/create", async (_req: Request, res: Response) => {
    try {
      res.json(await createWallet());
    } catch (err) {
      fail(res, err);
    }
  });

  // OPTION A step 2: confirm by the last 4 chars, then activate.
  router.post("/confirm", async (req: Request, res: Response) => {
    try {
      res.json(await confirmWallet(req.body?.last4));
    } catch (err) {
      fail(res, err);
    }
  });

  // OPTION B: import an existing secret as the first active wallet.
  router.post("/import", async (req: Request, res: Response) => {
    try {
      res.json(await importWallet(req.body?.secret));
    } catch (err) {
      fail(res, err);
    }
  });

  // Replace the active wallet (password re-auth + cancel old orders/stops).
  router.post("/replace", async (req: Request, res: Response) => {
    try {
      res.json(await replaceWallet(req.body?.secret, req.body?.password));
    } catch (err) {
      fail(res, err);
    }
  });

  // Testnet-only Friendbot funding of the active wallet.
  router.post("/friendbot", async (_req: Request, res: Response) => {
    try {
      res.json(await fundViaFriendbot());
    } catch (err) {
      fail(res, err);
    }
  });

  // NON-CUSTODIAL: register a client-generated wallet by PUBLIC KEY only — the
  // server never receives a secret. Signing happens on the device. For STELLAR
  // this is flag-gated by NONCUSTODIAL_MODE (it changes the trading chain's
  // signing story); for other chains, being operator-enabled in CHAINS is the
  // opt-in — they have no custodial alternative at all (service validates).
  router.post("/register", async (req: Request, res: Response) => {
    const chain = String(req.body?.chain ?? "stellar").trim().toLowerCase() || "stellar";
    if (chain === "stellar" && !config.nonCustodial) {
      res.status(404).json({ error: "Non-custodial mode is not enabled." });
      return;
    }
    try {
      res.json(await registerWallet(req.body?.publicKey, chain));
    } catch (err) {
      fail(res, err);
    }
  });

  // MULTI-CHAIN (2026-07): per-chain wallet overview for the setup/manage +
  // Receive UIs. One entry per enabled chain (plus any chain the user still
  // holds a wallet on). Addresses + balances only - never a secret.
  router.get("/chains", async (_req: Request, res: Response) => {
    try {
      res.json({ chains: await getWalletsOverview() });
    } catch (err) {
      fail(res, err);
    }
  });

  // MULTI-CHAIN: remove the wallet on one chain. Only allowed when the
  // on-ledger account is verifiably EMPTY (fails closed when unverifiable).
  router.delete("/chain/:chain", async (req: Request, res: Response) => {
    try {
      res.json(await removeChainWallet(req.params.chain));
    } catch (err) {
      fail(res, err);
    }
  });

  return router;
}
