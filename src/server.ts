import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import { existsSync } from "node:fs";
import { timingSafeEqual, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config, isReadOnly, dbConfigured } from "./config";
import { checkOrigin, isLoopbackBind } from "./csrf";
import { aiReady, aiModel, aiProviderId } from "./ai";
import { store } from "./trading/store";
import {
  runAnalysis,
  runChainScan,
  approve,
  autoApprove,
  reject,
  placeManualOrder,
  runExclusive,
} from "./trading/orchestrator";
import { stopLossService, StopLossError } from "./trading/stopLossService";
import { priceAlertService, PriceAlertError } from "./trading/priceAlertService";
import {
  getTrustlines,
  changeTrustline,
  resolveIssuerByDomain,
} from "./stellar/trustlineOps";
import { sendPayment, quoteSwap, swap } from "./stellar/transfers";
import { listClaimableBalances, claimBalance } from "./stellar/claimable";
import { canonicalAsset } from "./stellar/assets";
import { checkEgress } from "./policy/engine";
import { startAutoPilot, stopAutoPilot } from "./trading/autopilot";
import { startMonitor, stopMonitor } from "./trading/monitor";
import { settingsCatalog, settingLoop } from "./trading/settings";
import { assessSwapToXlm, swapClaimableToXlm } from "./stellar/claimableSwap";
import {
  startLiquidityScanner,
  stopLiquidityScanner,
  getLiquidityRecommendations,
} from "./trading/liquidityScanner";
import {
  getBalances,
  getMarketSnapshot,
  getOrderbook,
  getOpenOffers,
  getTradeAggregations,
  resolveBestQuote,
} from "./stellar/market";
import { getPricedPortfolio, type PricedPortfolio } from "./stellar/valuation";
import { highTierSpecs, describeAsset } from "./stellar/universe";
import { buildCancelOfferTransaction } from "./stellar/builder";
import { signerPublicKey, signAndSubmit } from "./stellar/signer";
import type { TradeProposal } from "./types";
import { initDb, closeDb, dbReady } from "./db/pool";

const here = dirname(fileURLToPath(import.meta.url));
// Production serves the built Vue SPA from web/dist. In development you run the
// Vite dev server (`npm run dev`) on :5175 instead, which proxies /api here.
const webDist = join(here, "..", "web", "dist");
const webBuilt = existsSync(join(webDist, "index.html"));

const app = express();
// SEC-20/22: only derive req.ip / req.protocol from X-Forwarded-* when a proxy
// is explicitly trusted; otherwise use the socket peer (so a client can't spoof
// its IP to dodge the auth rate limiter).
app.set("trust proxy", config.trustProxy);
// SEC-13: security headers. The stated priority is anti-clickjacking — even on a
// loopback bind a malicious page can frame the dashboard — so X-Frame-Options:
// DENY + CSP `frame-ancestors 'none'` lead. The rest is a self-contained,
// same-origin policy for the bundled SPA (inline styles are used by Vue/charts,
// hence 'unsafe-inline' for style only). We deliberately OMIT
// upgrade-insecure-requests so the default http loopback dashboard still loads.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "worker-src": ["'self'", "blob:"],
        "frame-ancestors": ["'none'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
      },
    },
    frameguard: { action: "deny" },
    // HSTS is meaningful only behind TLS; browsers ignore it over plain http
    // (the loopback default), so leaving helmet's default on is harmless.
  }),
);
// SEC-26: bound the JSON body so an oversized payload can't exhaust memory
// before auth even runs. The largest legitimate body (a risk profile / settings
// change) is well under 16kb.
app.use(express.json({ limit: "16kb" }));
// SEC-04: never leak the dashboard token (or any URL) to third parties via the
// Referer header on outbound navigations/subresources.
app.use((_req, res, next) => {
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
if (webBuilt) app.use(express.static(webDist));

// CSRF guard: reject cross-site STATE-CHANGING requests to /api. The decision
// lives in ./csrf (checkOrigin) so it can be unit-tested without booting the
// app; see that module for the full threat model. In short: loopback origins
// are trusted when the server is bound to a loopback interface (the default,
// and the dev setup where the Vite dev server on :5175 proxies here); an
// exposed (0.0.0.0) bind falls back to same-origin + X-Forwarded-Host +
// DASHBOARD_TRUSTED_ORIGINS. GET/HEAD/OPTIONS and non-browser clients are exempt.
const trustLoopback = isLoopbackBind(config.bindHost);
app.use((req, res, next) => {
  const verdict = checkOrigin(
    {
      method: req.method,
      path: req.path,
      origin: req.header("origin"),
      host: req.headers.host,
      xForwardedHost: req.header("x-forwarded-host"),
    },
    {
      port: config.port,
      trustedOrigins: config.trustedOrigins,
      trustLoopback,
      trustProxy: config.trustProxy,
    },
  );
  if (verdict === "allow") return next();
  res.status(403).json({
    error: verdict === "bad-origin" ? "bad origin" : "cross-origin request rejected",
  });
});

/**
 * Constant-time token compare. Avoids a timing side-channel that a byte-by-byte
 * `===` on a secret would leak. Returns false for an empty expected token (auth
 * disabled is handled by the caller) and for any length mismatch.
 */
function tokenMatches(provided: string, expected: string): boolean {
  if (expected === "") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// SEC-04: one-time, short-lived SSE tickets. EventSource can't send an
// Authorization header, so instead of leaking the long-lived token in the
// stream URL (logs / history / Referer), the SPA fetches a single-use ticket
// (POST /api/sse-ticket, Bearer-authed) and opens /api/stream?ticket=<t>. The
// ticket is consumed on first use and expires in 30s.
const sseTickets = new Map<string, number>();
function issueSseTicket(): string {
  const now = Date.now();
  for (const [k, exp] of sseTickets) if (exp < now) sseTickets.delete(k);
  const t = randomBytes(32).toString("hex");
  sseTickets.set(t, now + 30_000);
  return t;
}
function consumeSseTicket(t: string): boolean {
  if (!t) return false;
  const exp = sseTickets.get(t);
  if (exp == null) return false;
  sseTickets.delete(t); // single-use
  return exp >= Date.now();
}

// SEC-20: throttle token guessing per source IP - after AUTH_MAX_FAILS failed
// attempts in the window, that IP gets 429 until it rolls off. Bounded map; an
// entry is rewritten when its window expires.
const authFails = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 60_000;
const AUTH_MAX_FAILS = 10;
function authRateLimited(ip: string): boolean {
  const e = authFails.get(ip);
  return e != null && Date.now() <= e.resetAt && e.count >= AUTH_MAX_FAILS;
}
function recordAuthFail(ip: string): void {
  const now = Date.now();
  const e = authFails.get(ip);
  if (!e || now > e.resetAt) {
    authFails.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
  } else {
    e.count++;
  }
}

// Optional API auth. When DASHBOARD_TOKEN is set, every /api/* request (except
// the health probe) must present the token as `Authorization: Bearer <token>`.
// SEC-04: the legacy `?token=` query bootstrap is GONE (it leaked into logs /
// history / Referer); the SPA bootstraps the token from the URL #fragment and
// the SSE stream authenticates with a one-time ticket. No token = open (loopback).
app.use((req, res, next) => {
  if (config.dashboardToken === "") return next();
  if (!req.path.startsWith("/api")) return next();
  if (req.path === "/api/health") return next();
  // SSE: accept a valid one-time ticket in place of the (header-only) token.
  if (req.path === "/api/stream") {
    const ticket = typeof req.query.ticket === "string" ? req.query.ticket : "";
    if (consumeSseTicket(ticket)) return next();
  }
  // SEC-20: block brute-forcing IPs before doing the (constant-time) compare.
  const ip = req.ip ?? "unknown";
  if (authRateLimited(ip)) {
    res.status(429).json({ error: "too many attempts - try again later" });
    return;
  }
  const header = req.header("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (tokenMatches(bearer, config.dashboardToken)) return next();
  recordAuthFail(ip);
  res.status(401).json({ error: "unauthorized" });
});

// SEC-04: mint a one-time SSE ticket (Bearer-authed by the middleware above).
app.post("/api/sse-ticket", (_req, res) => {
  res.json({ ticket: issueSseTicket() });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, network: config.network });
});

app.get("/api/state", (_req, res) => {
  res.json(store.snapshot());
});

// Server-Sent Events: the live "watch along" feed.
const MAX_SSE_CONNECTIONS = 50;
app.get("/api/stream", (req, res) => {
  // SEC-26: cap concurrent SSE connections so a client can't open unbounded
  // streams (each holds a socket + receives every snapshot) to exhaust the
  // process. 50 is far above any legitimate single-operator dashboard use.
  if (store.subscriberCount() >= MAX_SSE_CONNECTIONS) {
    res.status(503).json({ error: "too many live connections" });
    return;
  }
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write(`event: state\ndata: ${JSON.stringify(store.snapshot())}\n\n`);
  store.subscribe(res);
  // A real "ping" EVENT (not an SSE comment): EventSource ignores comment lines,
  // so the browser can't use them to tell a live stream from a silently-dropped
  // one (e.g. the backend restarted behind the dev proxy, which then holds the
  // socket half-open). Emitting a real event lets the client run a liveness
  // watchdog and reconnect on its own - no manual refresh.
  const heartbeat = setInterval(() => res.write("event: ping\ndata: {}\n\n"), 5_000);
  req.on("close", () => clearInterval(heartbeat));
});

app.get("/api/balances", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json([]);
    return;
  }
  try {
    res.json(await getBalances(pub));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

/**
 * Shared gate for non-trade on-chain account ops (trustlines, payments,
 * claimable-balance claims). Writes go out only with a signing key, the kill
 * switch released, and live trading armed - the same "no on-chain submit unless
 * armed" invariant the trade path enforces. Returns false (and writes the
 * response) when blocked.
 */
function ensureCanSubmit(res: Response): boolean {
  if (isReadOnly) {
    res.status(400).json({ error: "Read-only mode: no STELLAR_SECRET configured." });
    return false;
  }
  if (store.killSwitch) {
    res.status(400).json({ error: "Kill switch is active - all on-chain actions are halted." });
    return false;
  }
  if (!store.liveTrading) {
    res.status(400).json({
      error: "Live trading is OFF - arm it on the dashboard before signing on-chain actions.",
    });
    return false;
  }
  return true;
}

/**
 * SEC-01 policy gate for the wallet endpoints (pay / swap / trustline / claim),
 * which sit OUTSIDE the DEX trade path and so don't run checkPolicy. Enforces the
 * asset whitelist and the daily-outflow cap (MAX_DAILY_EGRESS). Pass `amountXlm`
 * only for an actual OUTFLOW (a /api/pay send) so it counts against the cap.
 * Writes a 403 and returns false when blocked.
 */
function ensureEgressAllowed(
  res: Response,
  assets: string[],
  amountXlm?: number,
): boolean {
  const r = checkEgress({
    assets,
    amountXlm,
    egressTodayXlm: store.getEgressTodayXlm(),
    killSwitch: store.killSwitch,
  });
  if (!r.allowed) {
    res.status(403).json({ error: r.violations.join("; ") });
    return false;
  }
  return true;
}

/**
 * Feature 1: gate the AI entry points when the AI master switch is paused. The
 * autopilot loop already self-skips; this stops manual Ask-AI / Scan too.
 */
function ensureAiEnabled(res: Response): boolean {
  if (!store.aiEnabled) {
    res.status(409).json({
      error: "AI trading is paused. Enable it in the Bot Trading tab to analyze or scan.",
    });
    return false;
  }
  return true;
}

/**
 * SEC-16: throttle the PAID-LLM endpoints (/api/analyze, /api/scan). A single
 * in-flight slot stops a stuck tab or a script from fanning out concurrent paid
 * calls, and a sliding per-minute window caps the burst rate. Applied AFTER auth
 * so an unauthenticated caller can't even reach it. The autopilot loop calls the
 * orchestrator directly (already serialized) and is unaffected.
 */
let llmInFlight = false;
const llmHits: number[] = [];
const LLM_WINDOW_MS = 60_000;
const LLM_MAX_PER_WINDOW = 10;
function llmGateAcquire(res: Response): boolean {
  const now = Date.now();
  while (llmHits.length > 0 && now - (llmHits[0] as number) > LLM_WINDOW_MS) {
    llmHits.shift();
  }
  if (llmInFlight) {
    res.status(429).json({ error: "An AI request is already in progress - wait for it to finish." });
    return false;
  }
  if (llmHits.length >= LLM_MAX_PER_WINDOW) {
    res.status(429).json({ error: "Rate limit: too many AI requests this minute. Try again shortly." });
    return false;
  }
  llmHits.push(now);
  llmInFlight = true;
  return true;
}
function llmGateRelease(): void {
  llmInFlight = false;
}

/**
 * SEC-25: respond with a GENERIC error to the client while logging the real
 * (possibly internal-topology-revealing) upstream message server-side. Used for
 * 5xx failures; intentional 400 validation messages are returned verbatim.
 */
function failGeneric(res: Response, err: unknown, code: 500 | 502 = 502): void {
  store.log("error", `request failed (${code}): ${(err as Error)?.message ?? String(err)}`);
  if (!res.headersSent) res.status(code).json({ error: "request failed" });
}

/**
 * SEC-09: parse + bound a money-movement amount. The raw value MUST be a plain
 * decimal (up to 12 integer digits, 7 decimals) - this rejects scientific
 * notation like "1e9" that Number() would otherwise turn into a billion-unit
 * transfer. Also enforces the per-call ceiling (MAX_TRANSFER_AMOUNT, 0 = off).
 * Returns the parsed number, or null after writing the error response.
 */
const AMOUNT_RE = /^\d{1,12}(\.\d{1,7})?$/;
function parseTransferAmount(raw: unknown, res: Response, field = "amount"): number | null {
  const s = String(raw ?? "").trim();
  if (!AMOUNT_RE.test(s)) {
    res.status(400).json({
      error: `${field} must be a positive decimal with up to 7 places (no scientific notation).`,
    });
    return null;
  }
  const n = Number(s);
  if (!(n > 0)) {
    res.status(400).json({ error: `${field} must be greater than zero.` });
    return null;
  }
  const ceiling = config.limits.maxTransferAmount;
  if (ceiling > 0 && n > ceiling) {
    res.status(403).json({
      error: `${field} ${n} exceeds the per-transfer ceiling of ${ceiling} (MAX_TRANSFER_AMOUNT).`,
    });
    return null;
  }
  return n;
}

// Current non-native trustlines (asset, balance, limit). Read-only.
app.get("/api/trustlines", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json([]);
    return;
  }
  try {
    res.json(await getTrustlines(pub));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Add a trustline by {asset:"CODE:ISSUER"} or {code, issuer} or {code, homeDomain}.
app.post("/api/trustlines", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  const b = req.body ?? {};
  const assetSpec = String(b.asset ?? "").trim();
  const code = String(b.code ?? "").trim();
  let issuer = String(b.issuer ?? "").trim();
  const domain = String(b.homeDomain ?? b.domain ?? "").trim();
  try {
    let spec = assetSpec;
    if (!spec) {
      if (!code) {
        res.status(400).json({ error: "asset, or code (+ issuer/homeDomain), is required" });
        return;
      }
      if (!issuer && domain) issuer = await resolveIssuerByDomain(code, domain);
      if (!issuer) {
        res.status(400).json({ error: "issuer or homeDomain is required" });
        return;
      }
      spec = `${code}:${issuer}`;
    }
    // SEC-01: only establish trustlines for whitelisted assets (a wrong issuer
    // can be a scam clone of a well-known ticker).
    if (!ensureEgressAllowed(res, [spec])) return;
    const result = await runExclusive(() => changeTrustline(spec, { remove: false }));
    store.log("trade", `Trustline added: ${result.asset} (tx ${result.hash}).`);
    res.json(result);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Remove (zero-limit) a trustline; refuses when a balance is still held.
app.post("/api/trustlines/remove", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  const b = req.body ?? {};
  const assetSpec = String(b.asset ?? "").trim();
  const code = String(b.code ?? "").trim();
  const issuer = String(b.issuer ?? "").trim();
  const spec = assetSpec || (code && issuer ? `${code}:${issuer}` : "");
  if (!spec) {
    res.status(400).json({ error: "asset (or code + issuer) is required" });
    return;
  }
  try {
    const pub = signerPublicKey();
    if (pub) {
      const canon = canonicalAsset(spec).toUpperCase();
      const line = (await getTrustlines(pub)).find((l) => l.asset.toUpperCase() === canon);
      if (line && Number(line.balance) > 0) {
        res.status(400).json({
          error: `Cannot remove the ${line.code} trustline: balance is ${line.balance}. Sell or transfer it to zero first.`,
        });
        return;
      }
    }
    const result = await runExclusive(() => changeTrustline(spec, { remove: true }));
    store.log("trade", `Trustline removed: ${result.asset} (tx ${result.hash}).`);
    res.json(result);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// --- Open orders (resting offers) -----------------------------------------
// The signer account's resting offers — the user's "open manual orders" list.
app.get("/api/offers", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json([]);
    return;
  }
  try {
    res.json(await getOpenOffers(pub));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Cancel a resting offer by id (manage*Offer amount 0). Live-gated + serialized
// on the same execution queue as trades so it can't race a Horizon sequence.
app.post("/api/offers/:id/cancel", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  const offerId = String(req.params.id);
  const pub = signerPublicKey();
  if (!pub) {
    res.status(400).json({ error: "No signing account configured." });
    return;
  }
  try {
    const offer = (await getOpenOffers(pub)).find((o) => o.id === offerId);
    if (!offer) {
      res.status(404).json({ error: "Offer not found (already filled or cancelled?)." });
      return;
    }
    // Every Horizon offer is a sell offer (selling X, buying Y); a manageSellOffer
    // with amount 0 + the id deletes it. buildCancelOfferTransaction only reads
    // side/baseAsset/quoteAsset/limitPrice, so a minimal shape is sufficient.
    const synthetic = {
      side: "sell",
      baseAsset: offer.selling,
      quoteAsset: offer.buying,
      limitPrice: offer.price,
    } as unknown as TradeProposal;
    const hash = await runExclusive(async () => {
      const tx = await buildCancelOfferTransaction(synthetic, offerId);
      const r = await signAndSubmit(tx);
      return r.hash;
    });
    store.log(
      "trade",
      `Cancelled open offer ${offerId} (${offer.selling.split(":")[0]}/${offer.buying.split(":")[0]}).`,
    );
    store.logTrade({
      baseAsset: offer.selling,
      quoteAsset: offer.buying,
      action: "CANCEL",
      amount: offer.amount,
      price: offer.price,
      totalValue: (Number(offer.amount) * Number(offer.price)).toFixed(7),
      initiator: "MANUAL",
      status: "CANCELLED",
      txHash: hash,
      orderId: offerId,
    });
    res.json({ hash });
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// --- Payments / swaps / claimable balances --------------------------------
// Send a payment (same-asset) to a G... address or a federation address.
app.post("/api/pay", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  // SEC-01: raw external transfers are OFF by default - the trading function
  // never needs to send funds to a third party, so a compromised dashboard
  // (CSRF/XSS) cannot drain the hot wallet here. Whitelist + egress cap still
  // apply below when enabled.
  if (!config.allowRawTransfers) {
    res.status(403).json({
      error:
        "Raw external transfers are disabled. Set ALLOW_RAW_TRANSFERS=true to enable /api/pay.",
    });
    return;
  }
  const b = req.body ?? {};
  const destination = String(b.destination ?? "").trim();
  const asset = String(b.asset ?? "").trim() || "XLM";
  const amount = String(b.amount ?? "").trim();
  const memo = b.memo != null ? String(b.memo) : undefined;
  if (!destination) {
    res.status(400).json({ error: "destination is required" });
    return;
  }
  // SEC-09: strict decimal parse + per-transfer ceiling (no "1e9").
  const amountNum = parseTransferAmount(amount, res, "amount");
  if (amountNum == null) return;
  // SEC-01: whitelist the sent asset + bound the daily outflow (MAX_DAILY_EGRESS).
  if (!ensureEgressAllowed(res, [asset], amountNum)) return;
  try {
    const result = await runExclusive(() =>
      sendPayment({ destination, asset, amount, memo }),
    );
    store.recordEgress(amountNum);
    store.log(
      "trade",
      `Payment sent: ${amount} ${asset.split(":")[0]} -> ${destination.slice(0, 10)} (tx ${result.hash}).`,
    );
    res.json(result);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Quote a strict-send swap (read-only).
app.get("/api/swap/quote", async (req, res) => {
  const send = String(req.query.send ?? "").trim();
  const dest = String(req.query.dest ?? "").trim();
  const amount = String(req.query.amount ?? "").trim();
  if (!send || !dest || !(Number(amount) > 0)) {
    res.status(400).json({ error: "send, dest and a positive amount are required" });
    return;
  }
  try {
    res.json((await quoteSwap(send, amount, dest)) ?? { error: "No swap path found." });
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Execute a strict-send swap (path payment to self, slippage-bounded).
app.post("/api/swap", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  const b = req.body ?? {};
  const sendAsset = String(b.sendAsset ?? "").trim();
  const destAsset = String(b.destAsset ?? "").trim();
  const sendAmount = String(b.sendAmount ?? "").trim();
  const slippageBps = Number.isFinite(Number(b.slippageBps))
    ? Number(b.slippageBps)
    : undefined;
  if (!sendAsset || !destAsset) {
    res.status(400).json({ error: "sendAsset and destAsset are required" });
    return;
  }
  // SEC-09: strict decimal parse + per-transfer ceiling (no "1e9").
  const sendNum = parseTransferAmount(sendAmount, res, "sendAmount");
  if (sendNum == null) return;
  // SEC-07: reject an out-of-range slippage at the route (the swap() backstop
  // also clamps). An unbounded value would let destMin fall to 0.
  if (slippageBps != null && (slippageBps < 0 || slippageBps > config.limits.maxSwapSlippageBps)) {
    res.status(400).json({
      error: `slippageBps must be between 0 and ${config.limits.maxSwapSlippageBps}.`,
    });
    return;
  }
  // SEC-01: both legs must be whitelisted (the swap acquires destAsset, like a
  // trade). SEC-08: the swap's notional ALSO counts against the daily money-
  // movement budget (MAX_DAILY_EGRESS), so the circuit-breaker covers swaps as
  // well as plain sends (no-op when MAX_DAILY_EGRESS=0, the default).
  if (!ensureEgressAllowed(res, [sendAsset, destAsset], sendNum)) return;
  try {
    const result = await runExclusive(() =>
      swap({ sendAsset, sendAmount, destAsset, slippageBps }),
    );
    // SEC-08: count the swap against today's egress budget + book it to the
    // structured trade log so every money-movement path is audited (it
    // previously emitted only an ad-hoc text line). The FIFO PnL ledger is
    // deliberately left untouched - it tracks the bot's own round-trips with a
    // known cost basis, which a swap of arbitrary held assets does not have.
    store.recordEgress(sendNum);
    const swapPx =
      sendNum > 0 ? (Number(result.quoted) / sendNum).toFixed(7) : "0";
    store.logTrade({
      baseAsset: sendAsset,
      quoteAsset: destAsset,
      action: "SWAP",
      amount: sendAmount,
      price: swapPx,
      totalValue: result.quoted,
      initiator: "MANUAL",
      status: "FILLED",
      txHash: result.hash,
    });
    store.log(
      "trade",
      `Swap: ${sendAmount} ${sendAsset.split(":")[0]} -> ${destAsset.split(":")[0]} (min ${result.destMin}, tx ${result.hash}).`,
    );
    res.json(result);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Claimable balances ("pending payments") for the account. Locally-rejected
// ones (Feature 5) are hidden unless ?includeRejected=true; when included they
// are flagged so the UI can render + un-reject them.
app.get("/api/claimable", async (req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json([]);
    return;
  }
  try {
    const all = await listClaimableBalances(pub);
    const rejectedIds = store.rejectedClaimableIds();
    const includeRejected = String(req.query.includeRejected ?? "") === "true";
    const out = all
      .filter((c) => includeRejected || !rejectedIds.has(c.id))
      .map((c) =>
        rejectedIds.has(c.id)
          ? { ...c, rejected: true, rejectedReason: store.rejectedClaimableReason(c.id) }
          : c,
      );
    res.json(out);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Feature 3/4 — read-only value assessment of swapping ONE pending payment to
// XLM: estimated XLM out, the token's USDC value, and the % value loss. The UI
// uses this to show a favorable confirmation or a value-loss warning.
app.get("/api/claimable/:id/swap-quote", async (req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.status(400).json({ error: "Read-only mode: no STELLAR_SECRET configured." });
    return;
  }
  try {
    const cb = (await listClaimableBalances(pub)).find((c) => c.id === req.params.id);
    if (!cb) {
      res.status(404).json({ error: "claimable balance not found for this account" });
      return;
    }
    const assessment = await assessSwapToXlm(cb.asset, cb.amount);
    res.json({
      ...assessment,
      threshold: config.swap.valueLossThresholdPct,
      withinThreshold:
        assessment.valueLossPct == null ||
        assessment.valueLossPct <= config.swap.valueLossThresholdPct,
    });
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Feature 3 — swap ONE pending payment to XLM (claim + path-payment, atomic).
// Aborts when the value loss exceeds the configured threshold unless {force:true}.
app.post("/api/claimable/:id/swap", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  if (!config.swap.allowToXlm) {
    res.status(403).json({ error: "Swap-to-XLM is disabled (enable it in Settings)." });
    return;
  }
  const id = req.params.id;
  const force = Boolean(req.body?.force);
  try {
    const pub = signerPublicKey();
    const cb = pub
      ? (await listClaimableBalances(pub)).find((c) => c.id === id)
      : undefined;
    if (!cb) {
      res.status(404).json({ error: "claimable balance not found for this account" });
      return;
    }
    // SEC-01 (acquired-side): a swap-to-XLM only ever ACQUIRES XLM (whitelisted)
    // and disposes the held token, so gate the acquired side - the source token
    // need not be whitelisted. Also re-checks the kill switch.
    if (!ensureEgressAllowed(res, ["XLM"])) return;

    // Backend value-loss gate (mirrors the UI pre-check). Native = no swap.
    if (cb.asset !== "XLM" && !force) {
      const a = await assessSwapToXlm(cb.asset, cb.amount);
      if (a.valueLossPct != null && a.valueLossPct > config.swap.valueLossThresholdPct) {
        res.status(409).json({
          error:
            `Swapping to XLM would lose ~${a.valueLossPct}% of value (threshold ` +
            `${config.swap.valueLossThresholdPct}%). Confirm the swap to proceed anyway.`,
          assessment: a,
        });
        return;
      }
    }

    const result = await runExclusive(() =>
      swapClaimableToXlm({ id, asset: cb.asset, amount: cb.amount }),
    );
    const px =
      result.swapped && Number(result.amount) > 0
        ? (Number(result.estXlm) / Number(result.amount)).toFixed(7)
        : "1";
    store.logTrade({
      baseAsset: result.asset,
      quoteAsset: "XLM",
      action: "SWAP",
      amount: result.amount,
      price: px,
      totalValue: result.estXlm,
      initiator: "MANUAL",
      status: "FILLED",
      txHash: result.hash,
      source: "PENDING_PAYMENT",
    });
    store.log(
      "trade",
      result.swapped
        ? `Pending payment swapped to XLM: ${result.amount} ${result.asset.split(":")[0]} -> ~${result.estXlm} XLM (tx ${result.hash}).`
        : `Pending payment claimed: ${result.amount} XLM (tx ${result.hash}).`,
    );
    res.json(result);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Feature 4 — batch value assessment for "Swap All to XLM" (the summary table).
app.get("/api/claimable/swap-all/quote", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json({ items: [], threshold: config.swap.valueLossThresholdPct });
    return;
  }
  try {
    const rejectedIds = store.rejectedClaimableIds();
    const pending = (await listClaimableBalances(pub)).filter((c) => !rejectedIds.has(c.id));
    const items = await Promise.all(
      pending.map(async (c) => {
        try {
          const a = await assessSwapToXlm(c.asset, c.amount);
          return {
            id: c.id,
            ...a,
            withinThreshold:
              a.valueLossPct == null || a.valueLossPct <= config.swap.valueLossThresholdPct,
          };
        } catch {
          return {
            id: c.id,
            asset: c.asset,
            amount: c.amount,
            estXlm: null,
            tokenUsdc: null,
            xlmUsdc: null,
            valueLossPct: null,
            withinThreshold: false,
          };
        }
      }),
    );
    res.json({ items, threshold: config.swap.valueLossThresholdPct });
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Feature 4 — swap ALL (non-rejected) pending payments to XLM. Individual
// failures/skips never abort the batch; a summary is returned. {force:true}
// converts even value-losing balances (the UI confirms first).
app.post("/api/claimable/swap-all", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  if (!config.swap.allowToXlm) {
    res.status(403).json({ error: "Swap-to-XLM is disabled (enable it in Settings)." });
    return;
  }
  if (!ensureEgressAllowed(res, ["XLM"])) return;
  const force = Boolean(req.body?.force);
  const pub = signerPublicKey();
  if (!pub) {
    res.status(400).json({ error: "Read-only mode: no STELLAR_SECRET configured." });
    return;
  }
  const swapped: unknown[] = [];
  const skipped: { id: string; asset: string; reason: string }[] = [];
  const failed: { id: string; asset: string; error: string }[] = [];
  try {
    const rejectedIds = store.rejectedClaimableIds();
    const pending = (await listClaimableBalances(pub)).filter((c) => !rejectedIds.has(c.id));
    for (const c of pending) {
      try {
        if (c.asset !== "XLM" && !force) {
          const a = await assessSwapToXlm(c.asset, c.amount);
          if (a.valueLossPct != null && a.valueLossPct > config.swap.valueLossThresholdPct) {
            skipped.push({ id: c.id, asset: c.asset, reason: `value loss ${a.valueLossPct}%` });
            continue;
          }
        }
        const result = await runExclusive(() =>
          swapClaimableToXlm({ id: c.id, asset: c.asset, amount: c.amount }),
        );
        const px =
          result.swapped && Number(result.amount) > 0
            ? (Number(result.estXlm) / Number(result.amount)).toFixed(7)
            : "1";
        store.logTrade({
          baseAsset: result.asset,
          quoteAsset: "XLM",
          action: "SWAP",
          amount: result.amount,
          price: px,
          totalValue: result.estXlm,
          initiator: "MANUAL",
          status: "FILLED",
          txHash: result.hash,
          source: "PENDING_PAYMENT",
        });
        swapped.push(result);
      } catch (err) {
        failed.push({ id: c.id, asset: c.asset, error: (err as Error).message });
      }
    }
    store.log(
      "trade",
      `Swap-all pending payments: ${swapped.length} swapped, ${skipped.length} skipped, ${failed.length} failed.`,
    );
    res.json({ swapped, skipped, failed });
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Feature 5 — reject (locally hide) a pending payment. No on-chain action: the
// balance stays unclaimed; it just won't show in the default list or be claimed.
app.post("/api/claimable/:id/reject", async (req, res) => {
  const id = req.params.id;
  const reason = String(req.body?.reason ?? "user-initiated").trim() || "user-initiated";
  try {
    const pub = signerPublicKey();
    const cb = pub
      ? (await listClaimableBalances(pub)).find((c) => c.id === id)
      : undefined;
    store.rejectClaimable(id, { asset: cb?.asset ?? "?", amount: cb?.amount ?? "?" }, reason);
    res.json({ id, rejected: true });
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Feature 5 — un-reject a pending payment (it returns to the default list).
app.post("/api/claimable/:id/unreject", (req, res) => {
  store.unrejectClaimable(req.params.id);
  res.json({ id: req.params.id, rejected: false });
});

app.post("/api/claimable/:id/claim", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  const id = req.params.id;
  try {
    // Pre-check so a claim of a token we don't trust doesn't burn a fee failing.
    const pub = signerPublicKey();
    if (pub) {
      const cb = (await listClaimableBalances(pub)).find((c) => c.id === id);
      if (!cb) {
        res.status(404).json({ error: "claimable balance not found for this account" });
        return;
      }
      // SEC-01: only claim balances of whitelisted assets.
      if (!ensureEgressAllowed(res, [cb.asset])) return;
      if (cb.asset !== "XLM") {
        const trusted = (await getTrustlines(pub)).some((t) => t.asset === cb.asset);
        if (!trusted) {
          res.status(400).json({
            error: `Establish a ${cb.asset.split(":")[0]} trustline before claiming this balance.`,
          });
          return;
        }
      }
    }
    const result = await runExclusive(() => claimBalance(id));
    store.log("trade", `Claimed balance ${id.slice(0, 12)} (tx ${result.hash}).`);
    res.json(result);
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

app.get("/api/market", async (req, res) => {
  const base = String(req.query.base ?? "XLM");
  const quote = String(req.query.quote ?? "");
  if (!quote) {
    res.status(400).json({ error: "quote is required" });
    return;
  }
  try {
    res.json(await getMarketSnapshot(base, quote, 12));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Lean order book for the token detail page (one Horizon call, for the 30s
// auto-refresh). `quote` is optional: when omitted it is AUTO-RESOLVED to the
// market with liquidity (XLM preferred, else a blue-chip stablecoin), and the
// resolved quote is echoed back so the client polls the same book + candles.
const QUOTE_CANDIDATES = ["XLM", ...highTierSpecs()];
app.get("/api/orderbook", async (req, res) => {
  const base = String(req.query.base ?? "XLM").trim() || "XLM";
  const quoteParam = String(req.query.quote ?? "").trim();
  try {
    const quote = quoteParam || (await resolveBestQuote(base, QUOTE_CANDIDATES));
    res.json(await getOrderbook(base, quote, 20));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// OHLC candles for the price graph. resolution is validated against Horizon's
// allowed set; limit is clamped to [1, 365] (getTradeAggregations pages beyond
// Horizon's 200/page cap for the year view).
const ALLOWED_RESOLUTIONS = new Set([
  60_000, 300_000, 900_000, 3_600_000, 86_400_000, 604_800_000,
]);
app.get("/api/candles", async (req, res) => {
  const base = String(req.query.base ?? "XLM").trim() || "XLM";
  const quote = String(req.query.quote ?? "").trim();
  if (!quote) {
    res.status(400).json({ error: "quote is required" });
    return;
  }
  const resolution = Number(req.query.resolution ?? 3_600_000);
  if (!ALLOWED_RESOLUTIONS.has(resolution)) {
    res.status(400).json({
      error:
        "resolution must be one of 60000, 300000, 900000, 3600000, 86400000, 604800000",
    });
    return;
  }
  const limitRaw = Number(req.query.limit ?? 168);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(Math.trunc(limitRaw), 1), 365)
    : 168;
  try {
    res.json(await getTradeAggregations(base, quote, resolution, limit));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// Persisted trade history (paginated) for the table view.
app.get("/api/trades", async (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status ? String(req.query.status) : undefined;
  try {
    res.json(
      await store.getTradesPage({
        limit: Number.isFinite(limit) ? limit : 50,
        offset: Number.isFinite(offset) ? offset : 0,
        status,
      }),
    );
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Full trade history as CSV (download). Cells are escaped against CSV/formula
// injection; pages through the store up to a safety cap.
function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // neutralize spreadsheet formula injection
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
app.get("/api/trades.csv", async (_req, res) => {
  const cols = [
    "createdAt", "submittedAt", "side", "baseAsset", "quoteAsset", "amount",
    "limitPrice", "filledAmount", "filledPrice", "status", "initiator",
    "provider", "model", "reason", "txHash",
  ] as const;
  try {
    // SEC-26: STREAM the CSV page-by-page instead of buffering the whole export
    // (up to 50k rows) into one string in memory before sending.
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=trades.csv",
    });
    res.write(cols.join(",") + "\r\n");
    const pageSize = 500;
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < 50_000) {
      const page = await store.getTradesPage({ limit: pageSize, offset });
      total = page.total;
      let chunk = "";
      for (const p of page.rows) {
        const row = p as unknown as Record<string, unknown>;
        chunk += cols.map((c) => csvCell(row[c])).join(",") + "\r\n";
      }
      res.write(chunk);
      if (page.rows.length < pageSize) break;
      offset += pageSize;
    }
    res.end();
  } catch (err) {
    // Headers may already be flushed mid-stream; failGeneric guards on that.
    failGeneric(res, err, 500);
  }
});

// Portfolio: funded balances valued in XLM-equivalent (for the allocation view).
app.get("/api/portfolio", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    const empty: PricedPortfolio = {
      holdings: [],
      totalXlm: 0,
      totalUsd: null,
      xlmPriceUsd: null,
      updatedAt: new Date().toISOString(),
    };
    res.json(empty);
    return;
  }
  try {
    // USDC-primary valuation with an XLM-equivalent fallback. The pricing logic
    // lives in stellar/valuation.ts so it can be reused outside this endpoint.
    res.json(await getPricedPortfolio(pub));
  } catch (err) {
    failGeneric(res, err, 502);
  }
});

// The tradeable token universe with friendly labels — the source of truth for
// the UI's asset dropdowns. Built from the policy whitelist (config.limits)
// enriched with the curated names/domains; XLM is always included.
app.get("/api/universe", (_req, res) => {
  const tokens = config.limits.assetWhitelist.map((spec) => describeAsset(spec));
  res.json({ tokens });
});

// --- Price alerts (observe-only) ------------------------------------------
app.get("/api/alerts", (req, res) => {
  const base = req.query.base ? String(req.query.base) : undefined;
  const quote = req.query.quote ? String(req.query.quote) : undefined;
  res.json(priceAlertService.getActiveAlerts(base, quote));
});
app.post("/api/alerts", (req, res) => {
  const b = req.body ?? {};
  const base = String(b.base ?? "").trim();
  const quote = String(b.quote ?? "").trim();
  const direction =
    b.direction === "above" || b.direction === "below" ? b.direction : null;
  const price = String(b.price ?? "").trim();
  const note = b.note != null ? String(b.note) : undefined;
  if (!base || !quote) {
    res.status(400).json({ error: "base and quote are required" });
    return;
  }
  if (!direction) {
    res.status(400).json({ error: "direction must be 'above' or 'below'" });
    return;
  }
  if (!(Number(price) > 0)) {
    res.status(400).json({ error: "price must be a positive number" });
    return;
  }
  try {
    const alert = priceAlertService.setAlert({
      baseAsset: base,
      quoteAsset: quote,
      direction,
      price,
      note,
    });
    // Alerts are evaluated by the position monitor; if it's off they never fire.
    if (config.monitorIntervalSeconds <= 0) {
      const warning =
        "Alert created, but the position monitor is OFF (POSITION_MONITOR_INTERVAL_SECONDS=0) so it will not be evaluated until the monitor is enabled.";
      store.log("warn", warning);
      res.json({ ...alert, warning });
      return;
    }
    res.json(alert);
  } catch (err) {
    if (err instanceof PriceAlertError) {
      res.status(400).json({ error: err.message });
      return;
    }
    failGeneric(res, err, 500);
  }
});
app.post("/api/alerts/:id/cancel", (req, res) => {
  try {
    res.json(priceAlertService.cancelAlert(req.params.id));
  } catch (err) {
    if (err instanceof PriceAlertError) {
      res.status(404).json({ error: err.message });
      return;
    }
    failGeneric(res, err, 500);
  }
});

// Persisted, browsable log history (paginated + filterable by level/text/time).
app.get("/api/logs", async (req, res) => {
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  const level = req.query.level ? String(req.query.level) : undefined;
  const q = req.query.q ? String(req.query.q) : undefined;
  const since = req.query.since ? String(req.query.since) : undefined;
  try {
    res.json(
      await store.getLogsPage({
        limit: Number.isFinite(limit) ? limit : 50,
        offset: Number.isFinite(offset) ? offset : 0,
        level,
        q,
        since,
      }),
    );
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Structured TRADE log (paginated + filterable). Page size clamped 1..200.
app.get("/api/tradelog", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);
  try {
    res.json(
      await store.getTradeLogPage({
        limit,
        offset,
        initiator: req.query.initiator ? String(req.query.initiator) : undefined,
        action: req.query.action ? String(req.query.action) : undefined,
        token: req.query.token ? String(req.query.token) : undefined,
        from: req.query.from ? String(req.query.from) : undefined,
        to: req.query.to ? String(req.query.to) : undefined,
      }),
    );
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Structured AI log (paginated + filterable). Page size clamped 1..200.
app.get("/api/ailog", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 50) || 50, 1), 200);
  const offset = Math.max(Number(req.query.offset ?? 0) || 0, 0);
  try {
    res.json(
      await store.getAiLogPage({
        limit,
        offset,
        eventType: req.query.eventType ? String(req.query.eventType) : undefined,
        token: req.query.token ? String(req.query.token) : undefined,
        from: req.query.from ? String(req.query.from) : undefined,
        to: req.query.to ? String(req.query.to) : undefined,
      }),
    );
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Last-N combined trade+AI events for the live log (survives a page refresh).
app.get("/api/loglive", async (req, res) => {
  const n = Math.min(Math.max(Number(req.query.n ?? 20) || 20, 1), 100);
  try {
    res.json(await store.recentLogEvents(n));
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Cumulative volume / trades / PnL series for the evolution charts.
app.get("/api/evolution", async (_req, res) => {
  try {
    res.json(await store.getEvolution());
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Liquidity scanner output: current top-N recommendations (also on the SSE
// 'state' event) + the persisted history window for charts. Observe-only.
app.get("/api/liquidity", async (req, res) => {
  const since = req.query.since
    ? String(req.query.since)
    : new Date(
        Date.now() - config.liquidityRetentionDays * 86_400_000,
      ).toISOString();
  const asset = req.query.asset ? String(req.query.asset) : undefined;
  try {
    res.json({
      recs: getLiquidityRecommendations(),
      history: await store.getLiquidityHistory({ since, asset }),
    });
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

app.post("/api/analyze", async (req, res) => {
  const base = String(req.body?.base ?? "XLM");
  const quote = String(req.body?.quote ?? "");
  if (!quote) {
    res.status(400).json({ error: "quote is required" });
    return;
  }
  if (!ensureAiEnabled(res)) return;
  if (!aiReady()) {
    res.status(400).json({ error: "No AI API key configured" });
    return;
  }
  if (!llmGateAcquire(res)) return;
  try {
    res.json(await runAnalysis(base, quote));
  } catch (err) {
    store.log("error", `Analysis failed: ${(err as Error).message}`);
    failGeneric(res, err, 500);
  } finally {
    llmGateRelease();
  }
});

// Scan the curated universe of reputable tokens (each vs XLM) in one pass.
app.post("/api/scan", async (_req, res) => {
  if (!ensureAiEnabled(res)) return;
  if (!aiReady()) {
    res.status(400).json({ error: "No AI API key configured" });
    return;
  }
  if (!llmGateAcquire(res)) return;
  try {
    res.json(await runChainScan());
  } catch (err) {
    store.log("error", `Chain scan failed: ${(err as Error).message}`);
    failGeneric(res, err, 500);
  } finally {
    llmGateRelease();
  }
});

// Place a MANUAL limit order. Runs the SAME policy + preflight + live-arm gates
// as any trade (it just skips the AI auto-approve/conviction routing). Returns
// the resulting proposal (submitted / blocked+violations / pending_approval).
app.post("/api/order", async (req, res) => {
  const b = req.body ?? {};
  const baseAsset = String(b.base ?? "").trim();
  const quoteAsset = String(b.quote ?? "").trim();
  const side = b.side === "buy" || b.side === "sell" ? b.side : null;
  const amount = String(b.amount ?? "").trim();
  const limitPrice = String(b.limitPrice ?? b.limit_price ?? "").trim();
  if (!baseAsset || !quoteAsset) {
    res.status(400).json({ error: "base and quote are required" });
    return;
  }
  if (!side) {
    res.status(400).json({ error: "side must be 'buy' or 'sell'" });
    return;
  }
  if (!(Number(amount) > 0)) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }
  if (!(Number(limitPrice) > 0)) {
    res.status(400).json({ error: "limitPrice must be a positive number" });
    return;
  }
  const maxSlippageBps = Number.isFinite(Number(b.maxSlippageBps))
    ? Number(b.maxSlippageBps)
    : undefined;
  const targetPrice =
    b.targetPrice != null && Number(b.targetPrice) > 0 ? String(b.targetPrice) : undefined;
  const invalidationPrice =
    b.invalidationPrice != null && Number(b.invalidationPrice) > 0
      ? String(b.invalidationPrice)
      : undefined;
  try {
    res.json(
      await placeManualOrder({
        baseAsset,
        quoteAsset,
        side,
        amount,
        limitPrice,
        maxSlippageBps,
        targetPrice,
        invalidationPrice,
      }),
    );
  } catch (err) {
    store.log("error", `Manual order failed: ${(err as Error).message}`);
    failGeneric(res, err, 500);
  }
});

// --- Stop-loss management -------------------------------------------------
// Create a MANUAL stop loss. The service validates trigger vs market (below for
// a long, above for a short) and the independent monitor enforces it.
app.post("/api/stoploss", async (req, res) => {
  const b = req.body ?? {};
  const base = String(b.base ?? "").trim();
  const quote = String(b.quote ?? "").trim();
  const triggerPrice = String(b.triggerPrice ?? b.trigger_price ?? "").trim();
  const sellAll = b.sellAll === true || b.sell_all === true;
  const quantityToSell =
    b.quantityToSell != null
      ? String(b.quantityToSell).trim()
      : b.quantity != null
        ? String(b.quantity).trim()
        : undefined;
  const notes = b.notes != null ? String(b.notes) : undefined;
  if (!base || !quote) {
    res.status(400).json({ error: "base and quote are required" });
    return;
  }
  // Trailing vs regular. Trailing accepts trailPercent/trailAmount directly, or
  // the UI's {trailBy:'pct'|'amount', trailValue} shape.
  const isTrailing = b.isTrailing === true || b.stopType === "trailing";
  const trailPercent =
    b.trailPercent != null
      ? Number(b.trailPercent)
      : b.trailBy === "pct" && b.trailValue != null
        ? Number(b.trailValue)
        : undefined;
  const trailAmount =
    b.trailAmount != null
      ? Number(b.trailAmount)
      : b.trailBy === "amount" && b.trailValue != null
        ? Number(b.trailValue)
        : undefined;
  if (!isTrailing && !(Number(triggerPrice) > 0)) {
    res.status(400).json({ error: "triggerPrice must be a positive number" });
    return;
  }
  try {
    const stop = isTrailing
      ? await stopLossService.setTrailingStopLoss({
          baseAsset: base,
          quoteAsset: quote,
          trailPercent,
          trailAmount,
          sellAll,
          quantityToSell: sellAll ? undefined : quantityToSell,
          setBy: "manual",
          notes,
        })
      : await stopLossService.setStopLoss({
          baseAsset: base,
          quoteAsset: quote,
          triggerPrice,
          sellAll,
          quantityToSell: sellAll ? undefined : quantityToSell,
          setBy: "manual",
          notes,
        });
    res.json(stop);
  } catch (err) {
    if (err instanceof StopLossError) {
      res.status(400).json({ error: err.message });
      return;
    }
    failGeneric(res, err, 500);
  }
});

// Active stop losses (optionally filtered to a pair).
app.get("/api/stoploss", (req, res) => {
  const base = req.query.base ? String(req.query.base) : undefined;
  const quote = req.query.quote ? String(req.query.quote) : undefined;
  res.json(stopLossService.getActiveStopLosses(base, quote));
});

// Paginated audit trail for a pair (the collapsible section on the detail page).
// Registered before the :id route so "audit" is never read as an id.
app.get("/api/stoploss/audit", async (req, res) => {
  const base = req.query.base ? String(req.query.base) : undefined;
  const quote = req.query.quote ? String(req.query.quote) : undefined;
  const limit = Number(req.query.limit ?? 50);
  const offset = Number(req.query.offset ?? 0);
  try {
    res.json(
      await store.getStopLossAuditPage({
        base,
        quote,
        limit: Number.isFinite(limit) ? limit : 50,
        offset: Number.isFinite(offset) ? offset : 0,
      }),
    );
  } catch (err) {
    failGeneric(res, err, 500);
  }
});

// Cancel a stop loss (the user can cancel an AI-set stop too).
app.post("/api/stoploss/:id/cancel", (req, res) => {
  const reason = req.body?.reason ? String(req.body.reason) : undefined;
  try {
    res.json(stopLossService.cancelStopLoss(req.params.id, "manual", reason));
  } catch (err) {
    if (err instanceof StopLossError) {
      res.status(404).json({ error: err.message });
      return;
    }
    failGeneric(res, err, 500);
  }
});

app.post("/api/approve/:id", async (req, res) => {
  const p = await approve(req.params.id);
  if (!p) {
    res.status(404).json({ error: "proposal not found" });
    return;
  }
  res.json(p);
});

// Approve + submit without the manual click (still passes the policy engine).
app.post("/api/auto-approve/:id", async (req, res) => {
  const p = await autoApprove(req.params.id);
  if (!p) {
    res.status(404).json({ error: "proposal not found" });
    return;
  }
  res.json(p);
});

app.post("/api/reject/:id", (req, res) => {
  const p = reject(req.params.id);
  if (!p) {
    res.status(404).json({ error: "proposal not found" });
    return;
  }
  res.json(p);
});

app.post("/api/kill", (req, res) => {
  // Require an explicit boolean so a missing/empty body can never coerce to
  // setKill(false) and silently RELEASE the kill switch (defense-in-depth
  // behind the CSRF guard above).
  if (typeof req.body?.active !== "boolean") {
    res.status(400).json({ error: "active (boolean) is required" });
    return;
  }
  store.setKill(req.body.active);
  res.json({ killSwitch: store.killSwitch });
});

app.post("/api/auto-approve", (req, res) => {
  store.setAutoApprove(Boolean(req.body?.enabled));
  res.json({ autoApprove: store.autoApprove });
});

// AI risk profile (per-factor LOW/MEDIUM/HIGH). Validated + persisted by the
// store; takes effect on the next proposal (the policy reads it live).
app.post("/api/risk-profile", (req, res) => {
  res.json({ riskProfile: store.setRiskProfile(req.body ?? {}) });
});

// Feature 2 — operational settings. GET returns the full catalog (metadata +
// bounds + boot default + current value); the current values also ride the SSE
// snapshot (snapshot.settings) so the UI stays live. POST changes one setting
// (validated/clamped + persisted by the store) and restarts the affected loop.
app.get("/api/settings", (_req, res) => {
  res.json({ settings: settingsCatalog() });
});

// Restart the background loop affected by a setting change (if any). Re-calling
// start*() applies the new cadence and supersedes the prior loop (generation
// token). "wallet" is a UI-only refresh cadence (no backend loop).
function restartLoopForSetting(key: string): void {
  switch (settingLoop(key)) {
    case "autopilot":
      startAutoPilot();
      break;
    case "monitor":
      startMonitor();
      break;
    case "liquidity":
      startLiquidityScanner();
      break;
    default:
      break; // "wallet" (frontend) or non-loop setting: nothing to restart
  }
}

app.post("/api/settings", (req, res) => {
  const key = String(req.body?.key ?? "");
  try {
    const value = store.applySetting(key, req.body?.value);
    restartLoopForSetting(key);
    res.json({ key, value });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/api/settings/reset", (req, res) => {
  const key = String(req.body?.key ?? "");
  try {
    const value = store.resetSetting(key);
    restartLoopForSetting(key);
    res.json({ key, value });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Master arm switch: read-only (observe) vs. live trading (can submit on-chain).
// The store refuses to arm when no STELLAR_SECRET is configured.
app.post("/api/live-trading", (req, res) => {
  store.setLiveTrading(Boolean(req.body?.enabled));
  res.json({ liveTrading: store.liveTrading });
});

// Paper trading: policy-passing proposals fill in SIMULATION against the live
// book (no keys, no on-chain submit). Mutually exclusive with live trading.
app.post("/api/paper-trading", (req, res) => {
  store.setPaperTrading(Boolean(req.body?.enabled));
  res.json({ paperTrading: store.paperTrading, liveTrading: store.liveTrading });
});

// Feature 1: AI trading master switch (pause/resume the AI loop). Persisted.
app.post("/api/ai-enabled", (req, res) => {
  store.setAiEnabled(Boolean(req.body?.enabled));
  res.json({ aiEnabled: store.aiEnabled });
});

// Switch the active AI provider at runtime. Only providers with a configured
// API key can be selected (those are the ones the dashboard dropdown offers).
app.post("/api/provider", (req, res) => {
  const id = String(req.body?.id ?? "");
  if (!id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  if (!store.setAiProvider(id)) {
    res.status(400).json({ error: `unknown provider or no API key configured: ${id}` });
    return;
  }
  res.json({ aiProvider: aiProviderId(), model: aiModel() });
});

// SPA fallback: any non-API GET returns index.html so client-side routing works.
if (webBuilt) {
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(join(webDist, "index.html"));
  });
}

// SEC-23 + SEC-25: global error handler (4-arg middleware). Anything a route
// throws synchronously, or passes to next(err), lands here instead of crashing
// the connection - log the detail server-side and return a generic message.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  store.log("error", `Unhandled request error: ${(err as Error)?.message ?? String(err)}`);
  if (res.headersSent) return;
  res.status(500).json({ error: "request failed" });
});

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function connectDatabase(): Promise<void> {
  if (!dbConfigured) {
    store.log(
      "warn",
      "No SQL Server configured - running in-memory only (history will not persist).",
    );
    return;
  }
  // A freshly-started SQL Server (especially the docker container) can take
  // 15-40s to accept connections. Retry before giving up, so a co-started DB
  // (`npm run dev` + `docker compose up -d`) doesn't lose persistence - or, on
  // mainnet, trip the "DB unreachable" guard below - just because it booted a
  // few seconds slower than the app.
  const attempts = 12;
  for (let i = 1; i <= attempts; i++) {
    try {
      await initDb();
      store.log("info", "SQL Server connected; trade history persistence is ON.");
      await store.hydrateFromDb();
      return;
    } catch (err) {
      const msg = (err as Error).message;
      if (i < attempts) {
        store.log(
          "warn",
          `SQL Server not ready (attempt ${i}/${attempts}): ${msg}. Retrying in 5s...`,
        );
        await delay(5000);
      } else {
        store.log(
          "error",
          `SQL Server unavailable after ${attempts} attempts: ${msg}`,
        );
      }
    }
  }
}

async function start(): Promise<void> {
  // On mainnet, daily caps + realized PnL MUST survive a restart, otherwise the
  // MAX_DAILY_LOSS / volume / count guards silently reset to zero. Refuse to
  // boot without a database unless the operator explicitly opts out.
  if (
    config.network === "public" &&
    !dbConfigured &&
    !config.allowMainnetWithoutDb
  ) {
    console.error(
      "\n  REFUSING TO START: network=public but no SQL Server is configured.\n" +
        "  Without persistence, daily loss/volume/trade caps reset on every\n" +
        "  restart, disarming MAX_DAILY_LOSS. Configure SQLSERVER_* (recommended)\n" +
        "  or set ALLOW_MAINNET_WITHOUT_DB=true to accept that risk.\n",
    );
    process.exit(1);
  }

  await connectDatabase();

  // A CONFIGURED-but-unreachable DB on mainnet is as dangerous as no DB at all:
  // the daily loss/volume/count caps would silently run in-memory and reset on
  // every restart. Fail loud instead of pretending we're protected.
  if (
    config.network === "public" &&
    dbConfigured &&
    !dbReady() &&
    !config.allowMainnetWithoutDb
  ) {
    console.error(
      "\n  REFUSING TO START: network=public and SQL Server is configured but\n" +
        "  unreachable. Start it (docker compose up -d) and run `npm run db:migrate`,\n" +
        "  or set ALLOW_MAINNET_WITHOUT_DB=true to accept resettable caps.\n",
    );
    process.exit(1);
  }

  // SEC-20: a configured token that's too short is brute-forceable; refuse to
  // start with a weak one (empty = no auth, handled by the exposed-bind guard).
  if (config.dashboardToken !== "" && config.dashboardToken.length < 24) {
    console.error(
      "\n  REFUSING TO START: DASHBOARD_TOKEN is too short (< 24 chars).\n" +
        "  Use a long random secret, e.g. `openssl rand -hex 32`.\n",
    );
    process.exit(1);
  }

  // SEC-02 + SEC-14: fail CLOSED on a dangerous exposed posture, mirroring the
  // mainnet-without-DB hard-exit above (the audit's "fail-OPEN despite a proven
  // fail-CLOSED pattern" theme). A non-loopback bind serves a money-moving API,
  // so it MUST have a token (else anyone reaching the port has full control) and
  // a TLS acknowledgement (else the token crosses the wire in cleartext).
  if (!isLoopbackBind(config.bindHost)) {
    if (config.dashboardToken === "" && !config.allowExposedWithoutToken) {
      console.error(
        `\n  REFUSING TO START: BIND_HOST=${config.bindHost} is NOT loopback but\n` +
          "  DASHBOARD_TOKEN is empty. An unauthenticated, money-moving API would\n" +
          "  be reachable from other machines (arm live trading, drain the wallet).\n" +
          "  Set DASHBOARD_TOKEN, bind to 127.0.0.1, or (proxy-terminated auth only)\n" +
          "  set ALLOW_EXPOSED_WITHOUT_TOKEN=true.\n",
      );
      process.exit(1);
    }
    if (!config.allowInsecureExposed) {
      console.error(
        `\n  REFUSING TO START: BIND_HOST=${config.bindHost} is NOT loopback and TLS\n` +
          "  is not acknowledged. The dashboard token would be sent in cleartext.\n" +
          "  Put HTTPS in front and set ALLOW_INSECURE_EXPOSED=true to acknowledge,\n" +
          "  or bind to 127.0.0.1.\n",
      );
      process.exit(1);
    }
  }

  app.listen(config.port, config.bindHost, () => {
    store.log(
      "info",
      `Stellar AI Trading Bot listening on http://${config.bindHost}:${config.port} (${config.network})`,
    );
    if (isReadOnly) {
      store.log(
        "warn",
        "READ-ONLY mode: no STELLAR_SECRET set, trades cannot be submitted.",
      );
    }
    if (config.bindHost !== "127.0.0.1" && config.dashboardToken === "") {
      store.log(
        "warn",
        `SERVER EXPOSED on ${config.bindHost} with NO DASHBOARD_TOKEN - anyone who can reach this port can trigger trades. Set DASHBOARD_TOKEN or bind to 127.0.0.1.`,
      );
    }
    startAutoPilot();
    startMonitor();
    startLiquidityScanner();
    // Opt-in: arm live trading at startup instead of booting read-only. Goes
    // through setLiveTrading so it still refuses without a signing key or with
    // the monitor off; logs loudly so an armed boot is never silent.
    if (config.autoArmLiveTrading) {
      store.log(
        "warn",
        "AUTO_ARM_LIVE_TRADING=true: arming live trading at startup (set it false to boot read-only).",
      );
      if (!store.setLiveTrading(true)) {
        store.log(
          "error",
          "Auto-arm failed - staying READ-ONLY. Need a STELLAR_SECRET and POSITION_MONITOR_INTERVAL_SECONDS > 0.",
        );
      }
    }
    const mode = store.autoApprove ? "AUTO-TRADE" : "approve every trade";
    const host = config.bindHost === "0.0.0.0" ? "127.0.0.1" : config.bindHost;
    console.log("\n  Stellar AI Trading Bot");
    console.log(`  Dashboard: http://${host}:${config.port}`);
    console.log(`  Bind host: ${config.bindHost}${config.bindHost === "0.0.0.0" ? " (EXPOSED on all interfaces)" : " (loopback only)"}`);
    console.log(`  API auth:  ${config.dashboardToken ? "ON (token required)" : "OFF (no token)"}`);
    console.log(`  Network:   ${config.network}`);
    console.log(
      `  AI:        ${aiProviderId()} / ${aiModel()}${aiReady() ? "" : " (NO API KEY - analyst disabled)"}`,
    );
    console.log(`  Mode:      ${mode}`);
    console.log(
      `  Auto-pilot:${config.autoScanIntervalSeconds > 0 ? ` scan every ${config.autoScanIntervalSeconds}s` : " off"}`,
    );
    console.log(
      `  Monitor:   ${config.monitorIntervalSeconds > 0 ? `stops/offers/marks every ${Math.max(config.monitorIntervalSeconds, 15)}s` : "OFF (no exit management!)"}`,
    );
    console.log(`  Account:   ${signerPublicKey() ?? "(none configured)"}`);
    console.log(`  Read-only: ${isReadOnly}`);
    console.log(`  Database:  ${store.snapshot().dbConnected ? "SQL Server (persisting)" : "in-memory only"}`);
    console.log(
      `  Web UI:    ${
        webBuilt
          ? `built (served at http://localhost:${config.port})`
          : "not built - run `npm run dev` (Vite :5175) or `npm run build`"
      }\n`,
    );
  });
}

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    stopAutoPilot();
    stopMonitor();
    stopLiquidityScanner();
    void closeDb().finally(() => process.exit(0));
  });
}

// SEC-23: a hot signing process must not keep running in an unknown state after
// an unhandled error. DISARM live trading (best effort) and exit(1) so a process
// supervisor restarts us cleanly - and the restart boots READ-ONLY by default,
// so a crash can never leave the bot trading unattended in a corrupt state.
function panicExit(label: string, err: unknown): never {
  try {
    store.setLiveTrading(false);
  } catch {
    /* best effort - we're exiting anyway */
  }
  try {
    store.log(
      "error",
      `${label}: ${(err as Error)?.message ?? String(err)} - disarmed live trading, exiting(1) for restart.`,
    );
  } catch {
    /* ignore */
  }
  console.error(`\n  FATAL ${label}:`, err);
  console.error("  Live trading disarmed; exiting(1) for supervised restart.\n");
  process.exit(1);
}
process.on("unhandledRejection", (reason) => panicExit("unhandledRejection", reason));
process.on("uncaughtException", (err) => panicExit("uncaughtException", err));

void start();
