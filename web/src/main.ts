import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

const app = createApp(App);

// Production hardening (Fix 1): errors thrown outside a render/lifecycle path
// that onErrorCaptured (see ErrorBoundary.vue) can reach - e.g. event handlers,
// watchers, async callbacks - land here instead of being silently swallowed by
// Vue. This is a REAL live-mainnet app; losing an error with no trace is not
// acceptable, so always log it.
app.config.errorHandler = (err, instance, info) => {
  console.error("[app.config.errorHandler] uncaught error:", err, "info:", info, "component:", instance);
};

app.use(createPinia()).use(router).use(i18n).mount("#app");
