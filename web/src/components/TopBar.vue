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

// Fix 1: compact P&L + daily-loss-budget chips for the header. Reuse the exact
// store.daily / store.limits fields StatsPanel already reads — no new API
// calls, just a second, compact presentation so the "am I losing money right
// now" numbers are visible without scrolling to StatsPanel.
const realizedPnl = computed(() => store.daily?.realizedPnl ?? null);
const pnlPillClass = computed(() => {
  const v = realizedPnl.value;
  if (v == null || v === 0) return "";
  return v > 0 ? "pos" : "neg";
});
const pnlText = computed(() => `${fmtNum(realizedPnl.value, 2)} XLM`);

// The daily-loss circuit breaker (policy/engine.ts) halts NEW entries once
// realized+unrealized loss reaches maxDailyLoss — it applies to manual AND AI
// orders alike (only risk-reducing exits stay allowed past that point). This
// chip mirrors realizedPnl against that cap so the operator sees how close
// the breaker is to tripping, tapering warn -> danger the same way the engine
// tapers per-trade size (50% used) and halts (100% used).
const dailyLossCap = computed(() => store.limits?.maxDailyLoss ?? null);
const dailyLossUsed = computed(() => Math.max(0, -(realizedPnl.value ?? 0)));
const dailyLossRatio = computed(() => {
  const cap = dailyLossCap.value;
  return cap && cap > 0 ? dailyLossUsed.value / cap : 0;
});
const dailyLossPillClass = computed(() => {
  if (dailyLossRatio.value >= 1) return "neg";
  if (dailyLossRatio.value >= 0.5) return "warn";
  return "";
});
const dailyLossText = computed(
  () => `${fmtNum(dailyLossUsed.value, 2)} / ${fmtNum(dailyLossCap.value, 2)}`,
);
const dailyLossTitle = computed(() =>
  t("topBar.dailyLossTitle", { cap: fmtNum(dailyLossCap.value) }),
);

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

    <!-- Fix 2: PROMINENT cluster — always visible on every breakpoint (the
         network badge above is separate and also always-on). Trading-mode +
         paper/read-only badges, the Fix 1 P&L/daily-loss chips, and wallet
         value stay here; everything else demotes into the "More" cluster. -->
    <div class="badges-prominent">
      <span class="badge" :class="modeBadgeClass">{{ modeLabel }}</span>
      <span v-if="store.isPaper" class="badge warn">{{ t("topBar.paper") }}</span>
      <span v-else-if="store.snapshot?.readOnly" class="badge warn">{{ t("topBar.readOnly") }}</span>
      <!-- Fix 1: compact realized-P&L chip (green/red by sign). Reuses the
           same store.daily.realizedPnl field StatsPanel reads - no new call. -->
      <span
        v-if="store.daily"
        class="value-pill pnl-pill"
        :class="pnlPillClass"
        :title="t('topBar.pnlTitle')"
      >
        <span class="vp-k">{{ t("topBar.pnl") }}</span>
        <span class="vp-amt">{{ pnlText }}</span>
      </span>
      <!-- Fix 1: daily loss-budget chip, warn/danger as it nears the circuit-
           breaker cap. Inline here on desktop; on mobile the same data shows
           inside the collapsed "More" cluster instead (below) - the P&L chip
           is the one number kept prominent on every screen size. -->
      <span
        v-if="store.daily && store.limits"
        class="value-pill loss-pill loss-pill-desktop"
        :class="dailyLossPillClass"
        :title="dailyLossTitle"
      >
        <span class="vp-k">{{ t("topBar.dailyLoss") }}</span>
        <span class="vp-amt">{{ dailyLossText }}</span>
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

    <!-- Fix 2: secondary/status badges - now demoted behind "More" on EVERY
         breakpoint (previously always inline on desktop). 8+ equal-weight
         badges gave a newcomer no hierarchy; these are lower priority than
         the prominent cluster above. -->
    <div class="badges" :class="{ open: showMore }">
      <!-- Fix 1: mobile-only twin of the daily-loss chip above (hidden on
           desktop via CSS) so it's still reachable via "More" on small screens. -->
      <span
        v-if="store.daily && store.limits"
        class="value-pill loss-pill loss-pill-mobile"
        :class="dailyLossPillClass"
        :title="dailyLossTitle"
      >
        <span class="vp-k">{{ t("topBar.dailyLoss") }}</span>
        <span class="vp-amt">{{ dailyLossText }}</span>
      </span>
      <!-- Feature 1: AI trading master switch state. -->
      <span class="badge" :class="store.aiEnabled ? 'live' : 'danger'">
        {{ store.aiEnabled ? t("common.ai.active") : t("common.ai.paused") }}
      </span>
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

/* Fix 2: prominent status cluster — always visible, every breakpoint. */
.badges-prominent {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Fix 1: P&L / daily-loss chips reuse the .value-pill shape (see style.css)
   with a colour accent layered on for state - green/red by P&L sign, and
   warn/danger on the loss chip as it nears the circuit-breaker cap. */
.value-pill.pos {
  border-color: #1f5e42;
}
.value-pill.pos .vp-amt {
  color: var(--pos);
}
.value-pill.neg {
  border-color: #5e1f28;
}
.value-pill.neg .vp-amt {
  color: var(--neg);
}
.value-pill.warn {
  border-color: #5e4a1f;
}
.value-pill.warn .vp-amt {
  color: var(--warn);
}

/* The daily-loss chip has two copies: an always-inline desktop one in
   .badges-prominent, and a twin inside the collapsible .badges cluster for
   mobile. Only one is shown per breakpoint. */
.loss-pill-mobile {
  display: none;
}
@media (max-width: 767px) {
  .loss-pill-desktop {
    display: none;
  }
  .loss-pill-mobile {
    display: inline-flex;
  }
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
}

/* Fix 2: secondary/status badges (connection, DB, AI provider, AI active-
   paused, language) collapse behind "More" on EVERY breakpoint now - this
   used to be desktop-always-inline, which made 8+ badges equal-weight with
   no hierarchy. The toggle itself stays visually subtle (ghost button) since
   it's now a permanent header fixture, not just a mobile affordance. */
.badges {
  display: none;
}
.badges.open {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tb-more {
  display: inline-flex;
  background: transparent;
  border-color: transparent;
  color: var(--muted);
}
.tb-more:hover {
  border-color: var(--line);
  color: var(--text);
}

@media (max-width: 767px) {
  /* The sidebar already shows the brand; drop it here to save width. */
  .brand {
    display: none;
  }
  /* The demoted cluster still needs its own full-width row on small screens. */
  .badges.open {
    order: 99;
    flex-basis: 100%;
    width: 100%;
    margin-top: 4px;
  }
  /* Keep the kill switch readable but compact so the essential row fits. */
  .kill-btn {
    padding: 7px 12px;
  }
}
</style>
