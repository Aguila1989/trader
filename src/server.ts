import express, { type Response } from "express";
import { existsSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
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
import { startAutoPilot, stopAutoPilot } from "./trading/autopilot";
import { startMonitor, stopMonitor } from "./trading/monitor";
import {
  startLiquidityScanner,
  stopLiquidityScanner,
  getLiquidityRecommendations,
} from "./trading/liquidityScanner";
import {
  getBalances,
  getMarketSnapshot,
  getOrderbook,
  getTradeAggregations,
  resolveBestQuote,
} from "./stellar/market";
import { highTierSpecs } from "./stellar/universe";
import { signerPublicKey } from "./stellar/signer";
import { initDb, closeDb, dbReady } from "./db/pool";

const here = dirname(fileURLToPath(import.meta.url));
// Production serves the built Vue SPA from web/dist. In development you run the
// Vite dev server (`npm run dev`) on :5175 instead, which proxies /api here.
const webDist = join(here, "..", "web", "dist");
const webBuilt = existsSync(join(webDist, "index.html"));

const app = express();
app.use(express.json());
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
    { port: config.port, trustedOrigins: config.trustedOrigins, trustLoopback },
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

// Optional API auth. When DASHBOARD_TOKEN is set, every /api/* request (except
// the health probe) must present the token as `Authorization: Bearer <token>`
// or `?token=<token>` (the latter lets the browser's EventSource authenticate,
// since it can't send custom headers). No token configured = open (loopback).
app.use((req, res, next) => {
  if (config.dashboardToken === "") return next();
  if (!req.path.startsWith("/api")) return next();
  if (req.path === "/api/health") return next();
  const header = req.header("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const q = typeof req.query.token === "string" ? req.query.token : "";
  if (
    tokenMatches(bearer, config.dashboardToken) ||
    tokenMatches(q, config.dashboardToken)
  ) {
    return next();
  }
  res.status(401).json({ error: "unauthorized" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, network: config.network });
});

app.get("/api/state", (_req, res) => {
  res.json(store.snapshot());
});

// Server-Sent Events: the live "watch along" feed.
app.get("/api/stream", (req, res) => {
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
    res.status(502).json({ error: (err as Error).message });
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
    res.status(502).json({ error: (err as Error).message });
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
    const result = await runExclusive(() => changeTrustline(spec, { remove: false }));
    store.log("trade", `Trustline added: ${result.asset} (tx ${result.hash}).`);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
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
    res.status(502).json({ error: (err as Error).message });
  }
});

// --- Payments / swaps / claimable balances --------------------------------
// Send a payment (same-asset) to a G... address or a federation address.
app.post("/api/pay", async (req, res) => {
  if (!ensureCanSubmit(res)) return;
  const b = req.body ?? {};
  const destination = String(b.destination ?? "").trim();
  const asset = String(b.asset ?? "").trim() || "XLM";
  const amount = String(b.amount ?? "").trim();
  const memo = b.memo != null ? String(b.memo) : undefined;
  if (!destination) {
    res.status(400).json({ error: "destination is required" });
    return;
  }
  if (!(Number(amount) > 0)) {
    res.status(400).json({ error: "amount must be a positive number" });
    return;
  }
  try {
    const result = await runExclusive(() =>
      sendPayment({ destination, asset, amount, memo }),
    );
    store.log(
      "trade",
      `Payment sent: ${amount} ${asset.split(":")[0]} -> ${destination.slice(0, 10)} (tx ${result.hash}).`,
    );
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
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
    res.status(502).json({ error: (err as Error).message });
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
  if (!(Number(sendAmount) > 0)) {
    res.status(400).json({ error: "sendAmount must be a positive number" });
    return;
  }
  try {
    const result = await runExclusive(() =>
      swap({ sendAsset, sendAmount, destAsset, slippageBps }),
    );
    store.log(
      "trade",
      `Swap: ${sendAmount} ${sendAsset.split(":")[0]} -> ${destAsset.split(":")[0]} (min ${result.destMin}, tx ${result.hash}).`,
    );
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// Claimable balances ("pending payments") for the account.
app.get("/api/claimable", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json([]);
    return;
  }
  try {
    res.json(await listClaimableBalances(pub));
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
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
    res.status(502).json({ error: (err as Error).message });
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
    res.status(502).json({ error: (err as Error).message });
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
    res.status(502).json({ error: (err as Error).message });
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
    res.status(502).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
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
    const lines: string[] = [cols.join(",")];
    const pageSize = 500;
    let offset = 0;
    let total = Infinity;
    while (offset < total && offset < 50_000) {
      const page = await store.getTradesPage({ limit: pageSize, offset });
      total = page.total;
      for (const p of page.rows) {
        const row = p as unknown as Record<string, unknown>;
        lines.push(cols.map((c) => csvCell(row[c])).join(","));
      }
      if (page.rows.length < pageSize) break;
      offset += pageSize;
    }
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=trades.csv",
    });
    res.send(lines.join("\r\n"));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Portfolio: funded balances valued in XLM-equivalent (for the allocation view).
app.get("/api/portfolio", async (_req, res) => {
  const pub = signerPublicKey();
  if (!pub) {
    res.json({ holdings: [], totalXlm: 0 });
    return;
  }
  try {
    const balances = await getBalances(pub);
    const funded = balances.filter(
      (b) => Number(b.balance) > 0 && !b.asset.startsWith("LP:"),
    );
    const holdings = await Promise.all(
      funded.map(async (b) => {
        if (b.asset === "XLM") {
          return { asset: b.asset, balance: b.balance, xlmValue: Number(b.balance) };
        }
        try {
          // XLM/asset book prices the asset in units-per-XLM, so an asset
          // balance is worth balance/mid XLM.
          const ob = await getOrderbook("XLM", b.asset, 1);
          const mid =
            ob.bestBid != null && ob.bestAsk != null
              ? (ob.bestBid + ob.bestAsk) / 2
              : (ob.bestBid ?? ob.bestAsk);
          const value = mid && mid > 0 ? Number((Number(b.balance) / mid).toFixed(7)) : null;
          return { asset: b.asset, balance: b.balance, xlmValue: value };
        } catch {
          return { asset: b.asset, balance: b.balance, xlmValue: null };
        }
      }),
    );
    const totalXlm = holdings.reduce((s, h) => s + (h.xlmValue ?? 0), 0);
    res.json({ holdings, totalXlm: Number(totalXlm.toFixed(7)) });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
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
    res.status(500).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
  }
});

// Cumulative volume / trades / PnL series for the evolution charts.
app.get("/api/evolution", async (_req, res) => {
  try {
    res.json(await store.getEvolution());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/analyze", async (req, res) => {
  const base = String(req.body?.base ?? "XLM");
  const quote = String(req.body?.quote ?? "");
  if (!quote) {
    res.status(400).json({ error: "quote is required" });
    return;
  }
  if (!aiReady()) {
    res.status(400).json({ error: "No AI API key configured" });
    return;
  }
  try {
    res.json(await runAnalysis(base, quote));
  } catch (err) {
    store.log("error", `Analysis failed: ${(err as Error).message}`);
    res.status(500).json({ error: (err as Error).message });
  }
});

// Scan the curated universe of reputable tokens (each vs XLM) in one pass.
app.post("/api/scan", async (_req, res) => {
  if (!aiReady()) {
    res.status(400).json({ error: "No AI API key configured" });
    return;
  }
  try {
    res.json(await runChainScan());
  } catch (err) {
    store.log("error", `Chain scan failed: ${(err as Error).message}`);
    res.status(500).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
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
  if (!(Number(triggerPrice) > 0)) {
    res.status(400).json({ error: "triggerPrice must be a positive number" });
    return;
  }
  try {
    const stop = await stopLossService.setStopLoss({
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
    res.status(500).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
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
    res.status(500).json({ error: (err as Error).message });
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

void start();
