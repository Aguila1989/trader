<script setup lang="ts">
// Premium pricing/upgrade page (Feature 2). Shows the user's current tier and
// fee rate, the full tier/fee comparison table, a break-even callout, a live
// fee calculator, and (when billing is configured and the user isn't already
// Premium) the upgrade CTA with plan selection and the mandatory AI-cost
// acknowledgement. The server is authoritative for tier/fee calculation and
// for premium gating on AI endpoints - this page only mirrors billingState.
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { billingApi } from "../api";
import { billingState, loadBillingStatus } from "../billing/premium";
import { session } from "../auth/session";
import { dateTimeStr } from "../format";

const { t } = useI18n();
const route = useRoute();

onMounted(async () => {
  await loadBillingStatus();
  if (route.query.checkout === "success") {
    await loadBillingStatus(true);
  }
});

// --- checkout query banners ---
const checkoutBanner = computed<"success" | "cancelled" | null>(() => {
  const q = route.query.checkout;
  if (q === "success") return "success";
  if (q === "cancelled") return "cancelled";
  return null;
});

// --- tier table ---
const TIERS = ["Bronze", "Silver", "Gold", "Platinum"] as const;
type TierName = (typeof TIERS)[number];

const VOLUME_LABEL_KEY: Record<TierName, string> = {
  Bronze: "table.volumeBronze",
  Silver: "table.volumeSilver",
  Gold: "table.volumeGold",
  Platinum: "table.volumePlatinum",
};

// Lower-bound (inclusive) volume boundaries, matching the table copy:
// Bronze < 5,000; Silver 5,000-20,000; Gold 20,000-50,000; Platinum > 50,000.
const TIER_BOUNDARIES: { tier: TierName; min: number }[] = [
  { tier: "Bronze", min: 0 },
  { tier: "Silver", min: 5000 },
  { tier: "Gold", min: 20000 },
  { tier: "Platinum", min: 50000 },
];

function tierForVolume(v: number): TierName {
  let result: TierName = "Bronze";
  for (const b of TIER_BOUNDARIES) {
    if (v >= b.min) result = b.tier;
  }
  return result;
}

function pct(fraction: number | null | undefined): string {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return "-";
  return `${(fraction * 100).toFixed(2)}%`;
}

// Trims trailing zeros but keeps up to 2 decimals (e.g. 12.50 -> "12.5", 12 -> "12").
function fmtXlm(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(2).replace(/\.?0+$/, "");
}

// --- fee calculator ---
const volumeInput = ref<string>("");
const volumeNum = computed(() => {
  const n = Number(volumeInput.value);
  return Number.isFinite(n) && n > 0 ? n : 0;
});
const calcTier = computed(() => tierForVolume(volumeNum.value));
const calcRow = computed(() => billingState.rateTable?.[calcTier.value] ?? null);
const feeFree = computed(() => (calcRow.value ? volumeNum.value * calcRow.value.freeManual : 0));
const feePremiumManual = computed(() => (calcRow.value ? volumeNum.value * calcRow.value.premiumManual : 0));
const savings = computed(() => Math.max(0, feeFree.value - feePremiumManual.value));

// --- upgrade CTA ---
const selectedPlan = ref<"monthly" | "annual">("monthly");
const ackChecked = ref(false);
const upgrading = ref(false);
const upgradeError = ref("");

const annualDiscountPercent = computed(() => {
  const monthly = billingState.prices.monthlyEur;
  const annual = billingState.prices.annualEur;
  if (!monthly) return 0;
  return Math.round((1 - annual / (12 * monthly)) * 100);
});

const canUpgrade = computed(() => ackChecked.value && !upgrading.value);

async function upgrade(): Promise<void> {
  if (!canUpgrade.value) return;
  upgradeError.value = "";
  upgrading.value = true;
  try {
    const r = await billingApi.checkout(selectedPlan.value, true);
    if (r.ok && r.data?.url) {
      window.location.href = r.data.url;
    } else {
      upgradeError.value = (r.data as { error?: string } | undefined)?.error || t("pricing.cta.genericError");
      upgrading.value = false;
    }
  } catch {
    upgradeError.value = t("pricing.cta.genericError");
    upgrading.value = false;
  }
}

// Reset the ack + error whenever the plan changes, so a stale error from one
// plan doesn't linger after switching.
watch(selectedPlan, () => {
  upgradeError.value = "";
});
</script>

<template>
  <main class="page">
    <h1 class="page-title">{{ t("pricing.title") }}</h1>

    <div v-if="!billingState.loaded" class="panel muted">{{ t("pricing.loading") }}</div>

    <template v-else>
      <!-- B: checkout banners -->
      <div v-if="checkoutBanner === 'success'" class="panel price-banner success" role="status">
        {{ t("pricing.banner.success") }}
      </div>
      <div v-else-if="checkoutBanner === 'cancelled'" class="panel price-banner neutral" role="status">
        {{ t("pricing.banner.cancelled") }}
      </div>

      <!-- A: status strip -->
      <section v-if="session.user" class="panel price-status">
        <div class="price-status-row">
          <span>{{ t("pricing.status.yourTier", { tier: billingState.tier }) }}</span>
          <span class="sep">·</span>
          <span>{{ t("pricing.status.manualRate", { rate: (billingState.currentRates.manual * 100).toFixed(2) }) }}</span>
          <template v-if="billingState.isPremium && billingState.currentRates.ai !== null">
            <span class="sep">·</span>
            <span>{{ t("pricing.status.aiRate", { rate: (billingState.currentRates.ai * 100).toFixed(2) }) }}</span>
          </template>
          <span v-if="billingState.isPremium" class="badge live price-badge">{{ t("pricing.status.premiumBadge") }}</span>
        </div>
        <div v-if="billingState.isPremium" class="price-status-row muted">
          <span v-if="billingState.subscriptionStatus">{{ t("pricing.status.subStatus", { status: billingState.subscriptionStatus }) }}</span>
          <span v-if="billingState.subscriptionEnd" class="sep">·</span>
          <span v-if="billingState.subscriptionEnd">{{ t("pricing.status.nextBilling", { date: dateTimeStr(billingState.subscriptionEnd) }) }}</span>
        </div>
      </section>

      <!-- C: tier comparison table -->
      <section class="panel">
        <h2>{{ t("pricing.table.title") }}</h2>
        <div class="table-wrap">
          <table class="hist price-table">
            <thead>
              <tr>
                <th>{{ t("pricing.table.tier") }}</th>
                <th>{{ t("pricing.table.volume") }}</th>
                <th class="num">{{ t("pricing.table.freeManual") }}</th>
                <th class="num">{{ t("pricing.table.premiumManual") }}</th>
                <th class="num">{{ t("pricing.table.premiumAi") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tier in TIERS"
                :key="tier"
                :class="{ 'row-focus': billingState.tier === tier }"
              >
                <td>{{ tier }}</td>
                <td>{{ t(VOLUME_LABEL_KEY[tier]) }}</td>
                <td class="num mono">{{ pct(billingState.rateTable?.[tier]?.freeManual) }}</td>
                <td class="num mono">{{ pct(billingState.rateTable?.[tier]?.premiumManual) }}</td>
                <td class="num mono">{{ pct(billingState.rateTable?.[tier]?.premiumAi) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="db-note muted">{{ t("pricing.table.footnote") }}</p>
      </section>

      <!-- D: break-even banner -->
      <section class="panel price-breakeven">
        {{ t("pricing.breakeven") }}
      </section>

      <!-- E: fee calculator -->
      <section class="panel">
        <h2>{{ t("pricing.calculator.title") }}</h2>
        <label class="price-calc-field">
          <span>{{ t("pricing.calculator.volumeLabel") }}</span>
          <input
            v-model="volumeInput"
            type="number"
            inputmode="decimal"
            min="0"
            class="price-calc-input"
          />
        </label>
        <p class="muted">{{ t("pricing.calculator.tierLands", { tier: calcTier }) }}</p>
        <dl class="price-calc-results">
          <div class="price-calc-row">
            <dt>{{ t("pricing.calculator.feeFree", { amount: fmtXlm(feeFree) }) }}</dt>
          </div>
          <div class="price-calc-row">
            <dt>{{ t("pricing.calculator.feePremiumManual", { amount: fmtXlm(feePremiumManual) }) }}</dt>
          </div>
          <div class="price-calc-row price-calc-savings">
            <dt>{{ t("pricing.calculator.savings", { amount: fmtXlm(savings) }) }}</dt>
          </div>
        </dl>
      </section>

      <!-- F: upgrade CTA -->
      <section v-if="!billingState.isPremium" class="panel">
        <h2>{{ t("pricing.cta.title") }}</h2>

        <div v-if="!billingState.billingConfigured" class="muted">
          {{ t("pricing.cta.notConfigured") }}
        </div>
        <template v-else>
          <div class="price-plans">
            <button
              type="button"
              class="price-plan-card"
              :class="{ active: selectedPlan === 'monthly' }"
              @click="selectedPlan = 'monthly'"
            >
              <span class="price-plan-name">{{ t("pricing.cta.monthly") }}</span>
              <span class="price-plan-price mono">{{ t("pricing.cta.monthlyPrice", { price: billingState.prices.monthlyEur }) }}</span>
            </button>
            <button
              type="button"
              class="price-plan-card"
              :class="{ active: selectedPlan === 'annual' }"
              @click="selectedPlan = 'annual'"
            >
              <span class="price-plan-name">
                {{ t("pricing.cta.annual") }}
                <span class="badge live price-plan-badge">{{ t("pricing.cta.cheaperBadge", { percent: annualDiscountPercent }) }}</span>
              </span>
              <span class="price-plan-price mono">{{ t("pricing.cta.annualPrice", { price: billingState.prices.annualEur }) }}</span>
            </button>
          </div>

          <div class="price-ai-notice">
            <strong>{{ t("pricing.cta.aiNoticeTitle") }}</strong>
            <p>{{ t("pricing.cta.aiNotice") }}</p>
          </div>

          <label class="price-ack">
            <input v-model="ackChecked" type="checkbox" />
            <span>{{ t("pricing.cta.ack") }}</span>
          </label>

          <p v-if="upgradeError" class="violations" role="alert">{{ upgradeError }}</p>

          <button
            type="button"
            class="btn primary price-upgrade-btn"
            :disabled="!canUpgrade"
            @click="upgrade"
          >
            {{ upgrading ? t("pricing.cta.upgrading") : t("pricing.cta.upgradeButton") }}
          </button>
        </template>
      </section>
      <section v-else class="panel muted">
        {{ t("pricing.cta.currentPlan") }}
      </section>

      <!-- G: small print -->
      <p class="foot price-smallprint">{{ t("pricing.smallPrint") }}</p>
    </template>
  </main>
</template>

<style scoped>
.price-banner {
  font-size: 13px;
}
.price-banner.success {
  color: var(--pos);
  border-color: #1f5e42;
}
.price-banner.neutral {
  color: var(--muted);
}

.price-status {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.price-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}
.price-status-row .sep {
  color: var(--muted);
}
.price-badge {
  margin-left: 4px;
}

.price-table th, .price-table td {
  white-space: nowrap;
}

.price-breakeven {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  color: var(--text);
  border-color: var(--accent);
}

.price-calc-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  color: var(--muted);
  max-width: 320px;
  margin-bottom: 12px;
}
.price-calc-input {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 10px 12px;
  font-size: 14px;
  min-height: 44px;
  box-sizing: border-box;
}
.price-calc-input:focus {
  outline: none;
  border-color: var(--accent);
}
.price-calc-results {
  margin: 10px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.price-calc-row dt {
  margin: 0;
  font-size: 14px;
}
.price-calc-savings dt {
  color: var(--pos);
  font-weight: 600;
}

.price-plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
@media (max-width: 600px) {
  .price-plans { grid-template-columns: 1fr; }
}
.price-plan-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  color: var(--text);
  font: inherit;
  min-height: 44px;
  text-align: left;
}
.price-plan-card:hover {
  border-color: var(--accent);
}
.price-plan-card.active {
  border-color: var(--accent);
  background: #13233b;
}
.price-plan-name {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.price-plan-price {
  font-size: 20px;
  font-weight: 700;
}
.price-plan-badge {
  font-size: 11px;
}

.price-ai-notice {
  background: rgba(245, 166, 35, 0.1);
  border: 1px solid #5e4a1f;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
}
.price-ai-notice strong {
  color: var(--warn);
  font-size: 13px;
  display: block;
  margin-bottom: 6px;
}
.price-ai-notice p {
  margin: 0;
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}

.price-ack {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  margin-bottom: 14px;
}
.price-ack input {
  margin-top: 3px;
  min-width: 18px;
  min-height: 18px;
}

.price-upgrade-btn {
  min-height: 44px;
  width: 100%;
}
@media (min-width: 601px) {
  .price-upgrade-btn { width: auto; padding-left: 28px; padding-right: 28px; }
}

.price-smallprint {
  padding: 0 4px;
}
</style>
