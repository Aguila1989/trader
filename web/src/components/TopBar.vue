<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";

const { t } = useI18n();
const store = useTraderStore();

// Live total wallet value — USDC when priceable, else the XLM-equivalent.
const totalUsd = computed(() => store.portfolio?.totalUsd ?? null);
const totalXlm = computed(() => store.portfolio?.totalXlm ?? null);
const totalText = computed(() => {
  if (totalUsd.value != null) return `${fmtNum(totalUsd.value, 2)} USDC`;
  if (totalXlm.value != null) return `${fmtNum(totalXlm.value)} XLM`;
  return "—";
});

const networkBadge = computed(() => {
  const net = store.snapshot?.network;
  return net === "public"
    ? { text: "MAINNET", cls: "danger" }
    : { text: "TESTNET", cls: "live" };
});

const modeBadgeClass = computed(() => (store.isAutoTrade ? "warn" : ""));
// Localized mode badge (replaces the English store.modeLabel). The .badge CSS
// uppercases it, matching the original "AUTO-TRADE" / "APPROVE EVERY TRADE".
const modeLabel = computed(() =>
  store.isAutoTrade ? t("topBar.autoTrade") : t("topBar.approveEveryTrade"),
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

// Read-only / Paper / Live are mutually exclusive access modes. The backend
// enforces the exclusivity too; this just routes the click to the right toggle.
function setAccess(mode: "readonly" | "paper" | "live"): void {
  if (mode === "live") {
    if (!store.isLive) void store.setLiveTrading(true);
  } else if (mode === "paper") {
    if (!store.isPaper) void store.setPaperTrading(true);
  } else {
    if (store.isLive) void store.setLiveTrading(false);
    if (store.isPaper) void store.setPaperTrading(false);
  }
}
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="logo">&#10022;</span> {{ t("topBar.brand") }}</div>

    <div class="badges">
      <span class="badge" :class="networkBadge.cls">{{ networkBadge.text }}</span>
      <span class="badge" :class="modeBadgeClass">{{ modeLabel }}</span>
      <!-- Feature 1: AI trading master switch state, always visible. -->
      <span class="badge" :class="store.aiEnabled ? 'live' : 'danger'">
        {{ store.aiEnabled ? t("common.ai.active") : t("common.ai.paused") }}
      </span>
      <span v-if="store.isPaper" class="badge warn">{{ t("topBar.paper") }}</span>
      <span v-else-if="store.snapshot?.readOnly" class="badge warn">{{ t("topBar.readOnly") }}</span>
      <!-- AI provider picker: lists every provider that has a key configured.
           Switching is live; the model shown updates from the next snapshot. -->
      <select
        v-if="providers.length"
        class="ai-select"
        :value="activeProvider"
        :aria-label="t('topBar.aiProviderAria')"
        :title="t('topBar.aiProviderTitle')"
        @change="onProviderChange"
      >
        <option v-for="p in providers" :key="p.id" :value="p.id">
          {{ p.label }} &middot; {{ p.model }}
        </option>
      </select>
      <span v-else class="badge danger">{{ t("topBar.noApiKey") }}</span>
      <span class="badge" :class="store.connected ? 'live' : 'danger'">
        {{ store.connected ? t("topBar.connLive") : t("topBar.connOffline") }}
      </span>
      <span class="badge" :class="store.snapshot?.dbConnected ? 'live' : ''">
        {{ store.snapshot?.dbConnected ? t("topBar.dbOn") : t("topBar.dbInMemory") }}
      </span>
      <span
        v-if="store.portfolio"
        class="value-pill"
        :title="totalUsd != null ? `≈ ${fmtNum(totalXlm)} XLM` : t('topBar.totalWalletValue')"
      >
        <span class="vp-k">{{ t("topBar.value") }}</span>
        <span class="vp-amt">{{ totalText }}</span>
      </span>
    </div>

    <div class="controls">
      <!-- Master arm switch: observe / simulate / submit. Read-only, Paper and
           Live are mutually exclusive. Paper needs no key - it never submits. -->
      <div class="segmented" role="group" :aria-label="t('topBar.tradingAccessAria')">
        <button
          class="seg"
          :class="{ active: !store.isLive && !store.isPaper }"
          @click="setAccess('readonly')"
        >
          {{ t("topBar.readonlyBtn") }}
        </button>
        <button
          class="seg auto"
          :class="{ active: store.isPaper }"
          :title="t('topBar.paperTitle')"
          @click="setAccess('paper')"
        >
          {{ t("topBar.paperBtn") }}
        </button>
        <button
          class="seg live"
          :class="{ active: store.isLive }"
          :disabled="!store.canGoLive"
          :title="
            store.canGoLive
              ? t('topBar.liveTitleEnabled')
              : t('topBar.liveTitleDisabled')
          "
          @click="setAccess('live')"
        >
          {{ t("topBar.liveBtn") }}
        </button>
      </div>

      <!-- The headline toggle: approve each trade vs. fully automated. -->
      <div class="segmented" role="group" :aria-label="t('topBar.tradingModeAria')">
        <button
          class="seg"
          :class="{ active: !store.isAutoTrade }"
          @click="setMode(false)"
        >
          {{ t("topBar.approveEveryTrade") }}
        </button>
        <button
          class="seg auto"
          :class="{ active: store.isAutoTrade }"
          @click="setMode(true)"
        >
          {{ t("topBar.autoTrade") }}
        </button>
      </div>

      <button
        class="btn danger"
        :class="{ active: killOn }"
        @click="store.setKill(!killOn)"
      >
        {{ killOn ? t("topBar.killSwitchOn") : t("topBar.killSwitch") }}
      </button>
    </div>
  </header>
</template>
