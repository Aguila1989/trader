import { createApp } from "vue";
import { createPinia } from "pinia";
import * as Sentry from "@sentry/vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import { Buffer } from "buffer";

// stellar-base (client-side signing) expects a global Buffer, which Vite does not
// provide in the browser. Polyfill it before any wallet/signing module loads.
if (typeof (globalThis as { Buffer?: unknown }).Buffer === "undefined") {
  (globalThis as { Buffer?: unknown }).Buffer = Buffer;
}

const app = createApp(App);

// OPTIONAL Sentry error monitoring (frontend). Strict opt-in: blank (default)
// VITE_SENTRY_DSN means Sentry.init is never called - no network calls, zero
// behavior change. The static import above tree-shakes fine either way; only
// the init call below is gated. Build-time only (Vite bakes it into the
// bundle at `npm run build`), so it's set in web/.env, not the root .env.
const sentryDsn: string = import.meta.env.VITE_SENTRY_DSN ?? "";
if (sentryDsn !== "") {
  Sentry.init({
    app,
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    // Error monitoring only - no performance tracing.
    tracesSampleRate: 0,
  });
}

// Production hardening (Fix 1): errors thrown outside a render/lifecycle path
// that onErrorCaptured (see ErrorBoundary.vue) can reach - e.g. event handlers,
// watchers, async callbacks - land here instead of being silently swallowed by
// Vue. This is a REAL live-mainnet app; losing an error with no trace is not
// acceptable, so always log it.
app.config.errorHandler = (err, instance, info) => {
  console.error("[app.config.errorHandler] uncaught error:", err, "info:", info, "component:", instance);
  if (sentryDsn !== "") {
    Sentry.captureException(err);
  }
};

app.use(createPinia()).use(router).use(i18n).mount("#app");
