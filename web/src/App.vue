<script setup lang="ts">
// App shell. With vue-router, App is the persistent root. Feature 2 gates the
// trader store + live log behind authentication: the SSE stream and data calls
// only start once a user is logged in, so the login / Academy screens make no
// authenticated requests. A single 401 handler bounces an expired session back
// to the login screen from one place.
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useTraderStore } from "./stores/trader";
import { setUnauthorizedHandler } from "./api";
import { isLoggedIn, session, refreshSession } from "./auth/session";
import { resetWalletState } from "./wallet/walletState";
import LiveLogDrawer from "./components/LiveLogDrawer.vue";

const store = useTraderStore();
const router = useRouter();

let inited = false;
function maybeInit(): void {
  if (isLoggedIn() && !inited) {
    inited = true;
    void store.init();
  }
}

onMounted(() => {
  // Any 401 from the API means the session is gone/expired: drop local session
  // state and send the user to login (unless they're already on a public screen).
  setUnauthorizedHandler(() => {
    refreshSession();
    const name = String(router.currentRoute.value.name ?? "");
    if (name !== "login" && name !== "register" && name !== "academy") {
      void router.replace({ path: "/login" });
    }
  });
  maybeInit();
});

// After a successful login the marker flips; start the store then. Also forget
// any cached wallet status so a login (or user switch) re-fetches it fresh -
// otherwise the wallet-setup gate could read the previous user's status.
watch(
  () => session.user,
  () => {
    resetWalletState();
    maybeInit();
  },
);
</script>

<template>
  <router-view />
  <!-- The live log is only meaningful (and only authorized) once logged in. -->
  <LiveLogDrawer v-if="session.user" />
</template>
