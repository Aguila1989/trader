import express from "express";
import { existsSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config, isReadOnly, dbConfigured } from "./config";
import { aiReady, aiModel, aiProviderId } from "./ai";
import { store } from "./trading/store";
import {
  runAnalysis,
  runChainScan,
  approve,
  autoApprove,
  reject,
} from "./trading/orchestrator";
import { startAutoPilot, stopAutoPilot } from "./trading/autopilot";
import { startMonitor, stopMonitor } from "./trading/monitor";
import { getBalances, getMarketSnapshot } from "./stellar/market";
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

// Cumulative volume / trades / PnL series for the evolution charts.
app.get("/api/evolution", async (_req, res) => {
  try {
    res.json(await store.getEvolution());
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
  store.setKill(Boolean(req.body?.active));
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
    void closeDb().finally(() => process.exit(0));
  });
}

void start();
