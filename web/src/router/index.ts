// App router. Hash history so a refresh on any route works under static serving
// with no server-side route config.
//
// Structure (Change 1): the authenticated app is a shell (AppLayout) with the
// sidebar + header and a nested <router-view> for each sidebar destination —
// Trading (/), Receive & Send (/receive), Pending Payments (/pending), Logs
// (/logs). The Academy is a child too (so it gets the sidebar) but is marked
// meta.standalone so the trading header isn't shown over it, and meta.public so
// it's reachable with no session. Auth screens + the wallet-setup gate render
// standalone, outside the shell.
//
// Auth is determined CLIENT-SIDE from the readable session marker cookie (no API
// call). The server still enforces auth on every API call; this guard is only UX
// (a strict allowlist via meta.public — anything else requires a session).
import { createRouter, createWebHashHistory } from "vue-router";
import AppLayout from "../components/AppLayout.vue";
import TradingPage from "../components/TradingPage.vue";
import ReceiveSendPage from "../components/ReceiveSendPage.vue";
import PendingPaymentsPage from "../components/PendingPaymentsPage.vue";
import LogsPage from "../components/LogsPage.vue";
import { isLoggedIn } from "../auth/session";
import { loadWalletStatus, walletState } from "../wallet/walletState";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // --- standalone (no shell) ---
    { path: "/login", name: "login", component: () => import("../components/auth/LoginPage.vue"), meta: { public: true } },
    { path: "/register", name: "register", component: () => import("../components/auth/RegisterPage.vue"), meta: { public: true } },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../components/auth/ForgotPasswordPage.vue"),
      meta: { public: true },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("../components/auth/ResetPasswordPage.vue"),
      meta: { public: true },
    },
    {
      path: "/verify-email",
      name: "verify-email",
      component: () => import("../components/auth/VerifyEmailPage.vue"),
      meta: { public: true },
    },
    // The forced wallet-setup gate: logged-in, but intentionally no sidebar/header
    // so the user completes setup first.
    {
      path: "/wallet-setup",
      name: "wallet-setup",
      component: () => import("../components/wallet/WalletSetup.vue"),
    },

    // --- authenticated shell + Academy ---
    {
      path: "/",
      component: AppLayout,
      children: [
        { path: "", name: "trading", component: TradingPage },
        { path: "receive", name: "receive", component: ReceiveSendPage },
        { path: "pending", name: "pending", component: PendingPaymentsPage },
        { path: "logs", name: "logs", component: LogsPage },
        {
          // Feature 2: pricing/upgrade page. Sidebar but no trading header
          // (standalone, like the Academy) - it's a marketing/decision page.
          path: "pricing",
          name: "pricing",
          component: () => import("../components/PricingPage.vue"),
          meta: { standalone: true },
        },
        {
          // Feature 5: token detail as a real, bookmarkable page (order book +
          // chart + stop-loss form). ":assetIssuer" is "native" for XLM.
          // Standalone: full-screen focus, its own history-aware back bar.
          path: "token/:assetCode/:assetIssuer",
          name: "token",
          component: () => import("../components/TokenDetailPage.vue"),
          meta: { standalone: true },
        },
        {
          path: "academy",
          name: "academy",
          component: () => import("../academy/components/AcademyPage.vue"),
          meta: { public: true, standalone: true },
        },
        {
          // Stable lesson deeplink — same AcademyPage; it reads the params.
          path: "academy/chapter/:chapterId/lesson/:lessonId",
          name: "academy-lesson",
          component: () => import("../academy/components/AcademyPage.vue"),
          meta: { public: true, standalone: true },
        },
        {
          // Any unmatched URL (broken/shared link, typo) shows a real 404 instead
          // of silently bouncing to the dashboard. public+standalone like the
          // Academy: reachable with no session, sidebar shown but no trading
          // header. Nested here (not top-level) so it renders inside AppLayout.
          path: "/:pathMatch(.*)*",
          name: "not-found",
          component: () => import("../components/NotFound.vue"),
          meta: { public: true, standalone: true },
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const authed = isLoggedIn();
  const isPublic = to.meta.public === true;
  // Already-logged-in users never need the login/register screens.
  if (authed && (to.name === "login" || to.name === "register")) return { path: "/" };
  // Unauthenticated users may only reach the public allowlist; everything else
  // redirects to login, preserving where they were headed.
  if (!authed && !isPublic) {
    const redirect = to.fullPath && to.fullPath !== "/" ? { redirect: to.fullPath } : {};
    return { path: "/login", query: redirect };
  }
  // A logged-in user must set up a wallet before any trading screen. The Academy
  // (public) and the wallet-setup screen itself are exempt. Fails OPEN if status
  // can't be read (the server still enforces a wallet on every on-chain call).
  if (authed && !isPublic && to.name !== "wallet-setup") {
    await loadWalletStatus();
    if (walletState.loaded && !walletState.configured) {
      return { path: "/wallet-setup" };
    }
  }
  return true;
});

export default router;
