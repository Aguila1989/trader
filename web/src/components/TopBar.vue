<script setup lang="ts">
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";

const store = useTraderStore();

const networkBadge = computed(() => {
  const net = store.snapshot?.network;
  return net === "public"
    ? { text: "MAINNET", cls: "danger" }
    : { text: "TESTNET", cls: "live" };
});

const modeBadgeClass = computed(() =>
  store.modeLabel === "AUTO-TRADE" ? "warn" : "",
);

// Providers with a configured API key — the dropdown's options. When none are
// configured we fall back to a "no api key" badge instead of an empty select.
const providers = computed(() => store.snapshot?.aiProviders ?? []);
const activeProvider = computed(() => store.snapshot?.aiProvider ?? "");

function onProviderChange(e: Event): void {
  const id = (e.target as HTMLSelectElement).value;
  if (id && id !== activeProvider.value) void store.switchProvider(id);
}

const killOn = computed(() => store.snapshot?.killSwitch ?? false);

function setMode(auto: boolean): void {
  if (store.isAutoTrade !== auto) void store.setAutoApprove(auto);
}

function setLive(live: boolean): void {
  if (store.isLive !== live) void store.setLiveTrading(live);
}
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="logo">&#10022;</span> Stellar AI Trading Bot</div>

    <div class="badges">
      <span class="badge" :class="networkBadge.cls">{{ networkBadge.text }}</span>
      <span class="badge" :class="modeBadgeClass">{{ store.modeLabel }}</span>
      <span v-if="store.snapshot?.readOnly" class="badge warn">read-only</span>
      <!-- AI provider picker: lists every provider that has a key configured.
           Switching is live; the model shown updates from the next snapshot. -->
      <select
        v-if="providers.length"
        class="ai-select"
        :value="activeProvider"
        aria-label="AI provider"
        title="Active AI provider (only providers with an API key appear here)"
        @change="onProviderChange"
      >
        <option v-for="p in providers" :key="p.id" :value="p.id">
          {{ p.label }} &middot; {{ p.model }}
        </option>
      </select>
      <span v-else class="badge danger">no api key</span>
      <span class="badge" :class="store.connected ? 'live' : 'danger'">
        {{ store.connected ? "live" : "offline" }}
      </span>
      <span class="badge" :class="store.snapshot?.dbConnected ? 'live' : ''">
        {{ store.snapshot?.dbConnected ? "db on" : "in-memory" }}
      </span>
    </div>

    <div class="controls">
      <!-- Master arm switch: read-only (observe) vs. live (can submit). -->
      <div class="segmented" role="group" aria-label="Trading access">
        <button
          class="seg"
          :class="{ active: !store.isLive }"
          @click="setLive(false)"
        >
          Read-only
        </button>
        <button
          class="seg live"
          :class="{ active: store.isLive }"
          :disabled="!store.canGoLive"
          :title="
            store.canGoLive
              ? 'Allow policy-passing trades to submit on-chain (REAL orders)'
              : 'Add a STELLAR_SECRET to enable live trading'
          "
          @click="setLive(true)"
        >
          Live trading
        </button>
      </div>

      <!-- The headline toggle: approve each trade vs. fully automated. -->
      <div class="segmented" role="group" aria-label="Trading mode">
        <button
          class="seg"
          :class="{ active: !store.isAutoTrade }"
          @click="setMode(false)"
        >
          Approve every trade
        </button>
        <button
          class="seg auto"
          :class="{ active: store.isAutoTrade }"
          @click="setMode(true)"
        >
          Auto-trade
        </button>
      </div>

      <button
        class="btn danger"
        :class="{ active: killOn }"
        @click="store.setKill(!killOn)"
      >
        {{ killOn ? "Kill switch ON" : "Kill switch" }}
      </button>
    </div>
  </header>
</template>
