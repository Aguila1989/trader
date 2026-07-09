/**
 * OPTIONAL Sentry error monitoring. Strict opt-in no-op: when config.sentryDsn
 * is blank (the default), every function here returns immediately - no
 * `Sentry.init` call, no network calls, no behavior change whatsoever. Set
 * SENTRY_DSN to enable (see .env.example).
 *
 * Error monitoring only - tracesSampleRate stays 0 so this never adds
 * performance-tracing overhead or spend. Every entry point is wrapped so a
 * misconfigured DSN or a Sentry SDK internal failure can NEVER crash or
 * destabilize this REAL live-mainnet app; at worst monitoring is silently
 * unavailable and a console.warn is logged.
 */
import type { Express } from "express";
import * as Sentry from "@sentry/node";
import { config } from "../config";

// Importing the SDK has no side effects (no network calls, nothing scheduled)
// until Sentry.init() below actually runs - it only touches the network when
// SENTRY_DSN is set, keeping the strict-opt-in / zero-behavior-change contract.

/**
 * Initialize the Sentry Node SDK. No-op when SENTRY_DSN is unset. Call once,
 * as early as possible during boot (before other imports use the network),
 * but it never throws so it's safe to call unconditionally.
 */
export function initSentry(): void {
  if (config.sentryDsn === "") return;
  try {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.network,
      // Error monitoring only - no performance tracing.
      tracesSampleRate: 0,
    });
    console.log("[sentry] error monitoring enabled");
  } catch (err) {
    console.warn("[sentry] failed to initialize, continuing without it:", err);
  }
}

/**
 * Wire Sentry's Express error handler into `app`. Must be called AFTER all
 * routes are registered (Sentry's own requirement) and before any other
 * error-handling middleware you want Sentry to see errors from first. No-op
 * when SENTRY_DSN is unset.
 */
export function setupSentryErrorHandler(app: Express): void {
  if (config.sentryDsn === "") return;
  try {
    // v10 API: Sentry.setupExpressErrorHandler(app, options?)
    Sentry.setupExpressErrorHandler(app);
  } catch (err) {
    console.warn("[sentry] failed to attach express error handler:", err);
  }
}

/**
 * Manually report a caught error to Sentry. Safe no-op when monitoring is
 * disabled or unavailable - callers never need to guard this themselves.
 */
export function captureException(err: unknown): void {
  if (config.sentryDsn === "") return;
  try {
    Sentry.captureException(err);
  } catch {
    // Monitoring is best-effort only; never let a reporting failure surface.
  }
}
