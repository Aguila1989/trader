// App router. Hash history so a refresh on /#/academy works under static serving
// with no server-side route config. Feature 2 adds the auth screens and a
// navigation guard: the Academy is the ONLY app page reachable without a login;
// every other route bounces to /login. The dashboard + Academy are lazy-loaded.
import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "../components/Dashboard.vue";
import { isLoggedIn } from "../auth/session";
import { loadWalletStatus, walletState } from "../wallet/walletState";

// Routes reachable WITHOUT a valid session (a STRICT allowlist by route name):
// the five auth screens + the Academy. Anything not named here requires login.
const PUBLIC_ROUTES = new Set([
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "academy",
]);

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "dashboard", component: Dashboard },
    { path: "/login", name: "login", component: () => import("../components/auth/LoginPage.vue") },
    { path: "/register", name: "register", component: () => import("../components/auth/RegisterPage.vue") },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: () => import("../components/auth/ForgotPasswordPage.vue"),
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: () => import("../components/auth/ResetPasswordPage.vue"),
    },
    {
      path: "/verify-email",
      name: "verify-email",
      component: () => import("../components/auth/VerifyEmailPage.vue"),
    },
    {
      path: "/academy",
      name: "academy",
      component: () => import("../academy/components/AcademyPage.vue"),
    },
    {
      path: "/wallet-setup",
      name: "wallet-setup",
      component: () => import("../components/wallet/WalletSetup.vue"),
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

// Login state is determined CLIENT-SIDE from the readable session marker cookie
// (no authenticated API call) - see src/auth/session.ts. The server still
// enforces auth on every API call; this guard is only UX (where to send the SPA).
router.beforeEach(async (to) => {
  const authed = isLoggedIn();
  const isPublic = PUBLIC_ROUTES.has(String(to.name ?? ""));
  // Already-logged-in users never need the login/register screens.
  if (authed && (to.name === "login" || to.name === "register")) return { path: "/" };
  // Unauthenticated users may only reach the public allowlist; everything else
  // redirects to login, preserving where they were headed.
  if (!authed && !isPublic) {
    const redirect = to.fullPath && to.fullPath !== "/" ? { redirect: to.fullPath } : {};
    return { path: "/login", query: redirect };
  }
  // Feature 3: a logged-in user must set up a wallet before any trading screen.
  // The Academy (public) and the wallet-setup screen itself are exempt. The gate
  // fails OPEN if status can't be read (the server still enforces a wallet on
  // every on-chain call), so a transient error never locks the user out.
  if (authed && !isPublic && to.name !== "wallet-setup") {
    await loadWalletStatus();
    if (walletState.loaded && !walletState.configured) {
      return { path: "/wallet-setup" };
    }
  }
  return true;
});

export default router;
