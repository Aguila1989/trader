<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, UnauthorizedError, type Overview } from "./api";
import Login from "./components/Login.vue";
import OverviewTab from "./components/Overview.vue";
import TaxAndFees from "./components/TaxAndFees.vue";
import Users from "./components/Users.vue";
import SettingsTab from "./components/Settings.vue";
import Audit from "./components/Audit.vue";

type Tab = "overview" | "fees" | "users" | "settings" | "audit";

const authed = ref(false);
const checking = ref(true);
const overview = ref<Overview | null>(null);
const activeTab = ref<Tab>("overview");

async function checkAuth(): Promise<void> {
  checking.value = true;
  try {
    overview.value = await api.overview();
    authed.value = true;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      authed.value = false;
    } else {
      // Non-401 error (e.g. network hiccup): still show login; the operator
      // can retry from there.
      authed.value = false;
    }
  } finally {
    checking.value = false;
  }
}

function onLoggedIn(): void {
  authed.value = true;
  void checkAuth();
}

function onUnauthorized(): void {
  authed.value = false;
  overview.value = null;
}

async function logout(): Promise<void> {
  try {
    await api.logout();
  } catch {
    // best-effort — clear client state regardless
  }
  onUnauthorized();
}

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "fees", label: "Tax & Fees" },
  { id: "users", label: "Users" },
  { id: "settings", label: "Settings" },
  { id: "audit", label: "Audit" },
];

onMounted(checkAuth);
</script>

<template>
  <div v-if="checking" class="center" style="padding: 40px">Loading…</div>

  <Login v-else-if="!authed" @logged-in="onLoggedIn" />

  <div v-else>
    <header class="topbar">
      <span class="brand"><span class="logo">Atrium</span> Admin</span>
      <span v-if="overview" class="badge" :class="{ danger: overview.network === 'public' }">
        {{ overview.network === "public" ? "MAINNET" : overview.network }}
      </span>
      <div class="controls">
        <button class="btn" @click="logout">Log out</button>
      </div>
    </header>

    <main>
      <nav class="tabbar">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >
          {{ t.label }}
        </button>
      </nav>

      <OverviewTab v-if="activeTab === 'overview'" @unauthorized="onUnauthorized" />
      <TaxAndFees v-else-if="activeTab === 'fees'" :network="overview?.network ?? 'testnet'" @unauthorized="onUnauthorized" />
      <Users v-else-if="activeTab === 'users'" @unauthorized="onUnauthorized" />
      <SettingsTab v-else-if="activeTab === 'settings'" @unauthorized="onUnauthorized" />
      <Audit v-else-if="activeTab === 'audit'" @unauthorized="onUnauthorized" />
    </main>
  </div>
</template>
