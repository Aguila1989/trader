<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import LangSwitcher from "./LangSwitcher.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

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
const modeLabel = computed(() =>
  store.isAutoTrade ? t("topBar.autoTrade") : t("topBar.approveEveryTrade"),
);

const providers = computed(() => store.snapshot?.aiProviders ?? []);
const activeProvider = computed(() => store.snapshot?.aiProvider ?? "");
function onProviderChange(e: Event): void {
  const id = (e.target as HTMLSelectElement).value;
  if (id && id !== activeProvider.value) void store.switchProvider(id);
}

const killOn = computed(() => store.snapshot?.killSwitch ?? false);

// Feature 6: the kill switch is never an instant toggle anymore. Arming opens
// a consequences dialog with a 2s-armed destructive button; releasing opens a
// simpler reactivation confirm (also reachable from the paused banner).
const showKillConfirm = ref(false);
const showReactivateConfirm = ref(false);
function onKillClick(): void {
  if (killOn.value) showReactivateConfirm.value = true;
  else showKillConfirm.value = true;
}
function confirmKill(): void {
  showKillConfirm.value = false;
  void store.setKill(true);
}
function confirmReactivate(): void {
  showReactivateConfirm.value = false;
  void store.setKill(false);
}

// (Arming confirmation for Live / Auto-Approve lives in AiToggle.vue, where the
// toggle buttons are — gating there is robust; monkey-patching the store from
// here risked double-wrapping on a remount.)

// Mobile: secondary status badges collapse behind a "More" toggle so the header
// never wraps into disorganised rows. Desktop shows everything inline.
const showMore = ref(false);
</script>

<template>
  <header class="topbar">
    <div class="brand"><span class="logo">&#10022;</span> {{ t("topBar.brand") }}</div>

    <!-- Network is safety-critical (mainnet!) — always visible, even on mobile. -->
    <span class="badge net-badge" :class="networkBadge.cls">{{ networkBadge.text }}</span>

    <!-- Secondary status: inline on desktop, collapses behind "More" on mobile. -->
    <div class="badges" :class="{ open: showMore }">
      <span class="badge" :class="modeBadgeClass">{{ modeLabel }}</span>
      <!-- Feature 1: AI trading master switch state. -->
      <span class="badge" :class="store.aiEnabled ? 'live' : 'danger'">
        {{ store.aiEnabled ? t("common.ai.active") : t("common.ai.paused") }}
      </span>
      <span v-if="store.isPaper" class="badge warn">{{ t("topBar.paper") }}</span>
      <span v-else-if="store.snapshot?.readOnly" class="badge warn">{{ t("topBar.readOnly") }}</span>
      <!-- AI provider picker: lists every provider that has a key configured. -->
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
      <LangSwitcher class="tb-lang" />
    </div>

    <div class="controls">
      <!-- The always-reachable emergency kill switch + settings gear stay here;
           trade-access / mode controls live on the Bot Trading tab. On mobile a
           "More" toggle reveals the collapsed status badges above. -->
      <button
        class="btn icon-btn tb-more"
        type="button"
        :aria-label="t('common.more')"
        :title="t('common.more')"
        :aria-expanded="showMore"
        @click="showMore = !showMore"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="5" cy="12" r="1.7" fill="currentColor" />
          <circle cx="12" cy="12" r="1.7" fill="currentColor" />
          <circle cx="19" cy="12" r="1.7" fill="currentColor" />
        </svg>
      </button>
      <button
        class="btn danger kill-btn"
        :class="{ active: killOn }"
        @click="onKillClick"
      >
        {{ killOn ? t("topBar.killSwitchOn") : t("topBar.killSwitch") }}
      </button>
    </div>
  </header>

  <!-- Feature 6: persistent paused banner - a second, always-visible way back. -->
  <button v-if="killOn" class="ks-banner" type="button" @click="showReactivateConfirm = true">
    ⏸ {{ t("killSwitch.pausedBanner") }}
  </button>

  <ConfirmDialog
    v-if="showKillConfirm"
    :title="t('killSwitch.confirmTitle')"
    :confirm-label="t('killSwitch.confirm')"
    :cancel-label="t('killSwitch.cancel')"
    destructive
    :countdown-sec="2"
    @confirm="confirmKill"
    @cancel="showKillConfirm = false"
  >
    <p><strong>{{ t("killSwitch.willTitle") }}</strong></p>
    <ul>
      <li>{{ t("killSwitch.will.aiLoop") }}</li>
      <li>{{ t("killSwitch.will.proposals") }}</li>
      <li>{{ t("killSwitch.will.stopLoss") }}</li>
      <li>{{ t("killSwitch.will.scanners") }}</li>
    </ul>
    <p><strong>{{ t("killSwitch.wontTitle") }}</strong></p>
    <ul>
      <li>{{ t("killSwitch.wont.orders") }}</li>
      <li>{{ t("killSwitch.wont.stops") }}</li>
      <li>{{ t("killSwitch.wont.wallet") }}</li>
    </ul>
    <p>{{ t("killSwitch.manualNote") }}</p>
    <p class="cd-muted">{{ t("killSwitch.persistNote") }}</p>
  </ConfirmDialog>

  <ConfirmDialog
    v-if="showReactivateConfirm"
    :title="t('killSwitch.reactivateTitle')"
    :confirm-label="t('killSwitch.reactivate')"
    :cancel-label="t('killSwitch.cancel')"
    @confirm="confirmReactivate"
    @cancel="showReactivateConfirm = false"
  >
    <p>{{ t("killSwitch.reactivateBody") }}</p>
  </ConfirmDialog>
</template>

<style scoped>
/* Feature 6 follow-up: the paused/kill-switch banner had NO styling at all,
   so a halted bot (whose stop losses will NOT fire) could render as an
   unstyled, easy-to-miss element. Give it full-width, high-contrast,
   danger-weight treatment — heavier than the informational .tl-banner
   (trustline warnings) since this state means protective stops are off. */
.ks-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: rgba(255, 93, 108, 0.16);
  border: none;
  border-bottom: 1px solid #5e1f28;
  color: var(--neg);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-align: center;
  cursor: pointer;
}
.ks-banner:hover {
  background: rgba(255, 93, 108, 0.24);
}

.net-badge {
  flex-shrink: 0;
}
.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}
/* The "More" toggle is desktop-hidden — everything is inline there. */
.tb-more {
  display: none;
}

@media (max-width: 767px) {
  /* The sidebar already shows the brand; drop it here to save width. */
  .brand {
    display: none;
  }
  /* Collapse secondary badges behind the "More" toggle. */
  .badges {
    display: none;
    order: 99;
    flex-basis: 100%;
    width: 100%;
    margin-top: 4px;
  }
  .badges.open {
    display: flex;
  }
  .tb-more {
    display: inline-flex;
  }
  /* Keep the kill switch readable but compact so the essential row fits. */
  .kill-btn {
    padding: 7px 12px;
  }
  .controls {
    margin-left: auto;
  }
}
</style>
