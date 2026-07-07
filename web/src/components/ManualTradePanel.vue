<script setup lang="ts">
// Manual trading workspace: a YOU SELL → YOU BUY order form (sell-side dropdown
// is held-only with live balance validation), the order book for the chosen
// pair, and the list of open (resting) orders. A manual order is always framed
// as "sell the YOU-SELL asset for the YOU-BUY asset" — base = sell, quote =
// buy, side = sell — which maps directly onto placeManualOrder.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { dateTimeStr, fmtNum } from "../format";
import type { ManualOrderInput, OpenOffer } from "../types";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";
import { LESSONS } from "../academy/deeplinks";
import { billingState } from "../billing/premium";

const store = useTraderStore();
const { t } = useI18n();

const TIPS = computed(() => ({
  target: t("manualTrade.tips.target"),
  invalidation: t("manualTrade.tips.invalidation"),
  slippage: t("manualTrade.tips.slippage"),
  spread: t("manualTrade.tips.spread"),
  orderType: t("manualTrade.tips.orderType"),
  price: t("manualTrade.tips.price"),
}));

// YOU SELL = base (held-only); YOU BUY = quote (whole whitelist).
const sellToken = ref("XLM");
const buyToken = ref("");
const orderType = ref<"limit" | "market">("limit");
const amount = ref("");
const limitPrice = ref("");
const slippagePct = ref("");
const showAdvanced = ref(false);
const targetPrice = ref("");
const invalidationPrice = ref("");

const sellCode = computed(() => store.tokenFor(sellToken.value).code);
const buyCode = computed(() =>
  buyToken.value ? store.tokenFor(buyToken.value).code : t("manualTrade.tokenFallback"),
);
const available = computed(() => store.heldBalance(sellToken.value));

// Pull the book for the chosen pair whenever it changes.
watch([sellToken, buyToken], () => {
  if (sellToken.value && buyToken.value && sellToken.value !== buyToken.value) {
    void store.refreshMarket(sellToken.value, buyToken.value);
  }
});
function refresh(): void {
  if (sellToken.value && buyToken.value) void store.refreshMarket(sellToken.value, buyToken.value);
}

const bookMatchesPair = computed(
  () =>
    !!store.market &&
    store.market.base === sellToken.value &&
    store.market.quote === buyToken.value,
);
// Selling base hits the bid (quote received per 1 base).
const marketPrice = computed<number | null>(() =>
  bookMatchesPair.value ? store.market?.bestBid ?? null : null,
);
const effectivePrice = computed<number | null>(() => {
  if (orderType.value === "market") return marketPrice.value;
  const typed = Number(limitPrice.value);
  if (limitPrice.value.trim() && Number.isFinite(typed) && typed > 0) return typed;
  return marketPrice.value;
});
const pricePlaceholder = computed(() =>
  marketPrice.value != null ? fmtNum(marketPrice.value, 7) : t("manualTrade.pricePlaceholder"),
);

const amountNum = computed(() => Number(amount.value));
const youBuyAmount = computed<number | null>(() => {
  const px = effectivePrice.value;
  return Number.isFinite(amountNum.value) && amountNum.value > 0 && px != null && px > 0
    ? amountNum.value * px
    : null;
});

// --- Pre-commit cost/impact summary (fund-safety UX fix) -------------------
// Mirrors the slippage-bps resolution in placeOrder(): an explicitly typed
// tolerance wins, otherwise the effective policy default already advertised
// in the field's placeholder. Every manual order here is side:"sell" (base
// for quote), so the worst case is always "you receive >= X {buyCode}".
const effectiveSlippageBps = computed<number>(() => {
  const typed = Number(slippagePct.value);
  if (slippagePct.value.trim() && Number.isFinite(typed) && typed > 0) {
    return Math.round(typed * 100);
  }
  return store.limits?.maxSlippageBps ?? 0;
});
// Fraction of the order's proceeds the platform takes on manual trades, when
// billing/fees are actually turned on server-side (billing/premium.ts, same
// source PricingPage.vue uses). 0 when fees are not configured/enabled.
const feeFraction = computed(() =>
  billingState.feesEnabled ? billingState.currentRates.manual : 0,
);
const estFeeAmount = computed<number | null>(() => {
  const gross = youBuyAmount.value;
  return gross != null && feeFraction.value > 0 ? gross * feeFraction.value : null;
});
// Worst-case proceeds: gross amount reduced by the full slippage tolerance,
// then by the platform fee (if any). This is a client-side, conservative
// estimate — the network's own base fee (a few stroops) is not itemized here.
const worstCaseReceive = computed<number | null>(() => {
  const gross = youBuyAmount.value;
  if (gross == null) return null;
  const afterSlippage = gross * (1 - effectiveSlippageBps.value / 10_000);
  const afterFee = afterSlippage - (estFeeAmount.value ?? 0);
  return afterFee > 0 ? afterFee : 0;
});
const showCommitSummary = computed(() => orderValid.value && worstCaseReceive.value != null);

const pairValid = computed(
  () => !!sellToken.value && !!buyToken.value && sellToken.value !== buyToken.value,
);
const insufficient = computed(
  () => amountNum.value > 0 && amountNum.value > available.value,
);
// A LIMIT order must use an explicitly typed price — never silently fall back
// to the market bid (which would cross immediately). MARKET uses the live bid.
const priceValid = computed(() =>
  orderType.value === "market"
    ? marketPrice.value != null && marketPrice.value > 0
    : Number(limitPrice.value) > 0,
);
const orderValid = computed(
  () =>
    pairValid.value &&
    Number.isFinite(amountNum.value) &&
    amountNum.value > 0 &&
    priceValid.value &&
    effectivePrice.value != null &&
    effectivePrice.value > 0 &&
    !insufficient.value,
);
const noMarketBook = computed(
  () => orderType.value === "market" && pairValid.value && marketPrice.value == null,
);

const orderResult = computed(() => {
  const o = store.lastOrder;
  if (!o) return null;
  if (o.error) return { ok: false, text: o.error };
  if (o.policyViolations && o.policyViolations.length) {
    return { ok: false, text: t("manualTrade.result.blocked", { reasons: o.policyViolations.join("; ") }) };
  }
  switch (o.status) {
    case "submitted":
      return { ok: true, text: t("manualTrade.result.submitted") };
    case "pending_approval":
      return { ok: true, text: t("manualTrade.result.pendingApproval") };
    case "proposed":
      return { ok: true, text: t("manualTrade.result.resting") };
    case "submitting":
      return { ok: true, text: t("manualTrade.result.submitting") };
    default:
      return { ok: false, text: o.status };
  }
});

function fillFromBook(price: string): void {
  orderType.value = "limit";
  limitPrice.value = price;
}

// Bug 5: after picking a token in the Place Order form, move focus to the next
// logical input (the amount field) so the keyboard/mobile flow continues.
const amountEl = ref<HTMLInputElement | null>(null);
function focusAmount(): void {
  amountEl.value?.focus();
}

async function placeOrder(): Promise<void> {
  if (!orderValid.value || store.placingOrder) return;
  const input: ManualOrderInput = {
    base: sellToken.value,
    quote: buyToken.value,
    side: "sell",
    amount: amount.value.trim(),
    limitPrice: String(effectivePrice.value),
  };
  const slip = Number(slippagePct.value);
  if (slippagePct.value.trim() && Number.isFinite(slip) && slip > 0) {
    input.maxSlippageBps = Math.round(slip * 100);
  }
  if (targetPrice.value.trim()) input.targetPrice = targetPrice.value.trim();
  if (invalidationPrice.value.trim()) input.invalidationPrice = invalidationPrice.value.trim();
  await store.placeOrder(input);
  // Reflect a new resting offer / changed balance without a full reload.
  void store.loadOffers();
  void store.loadBalances();
}

// --- Active Orders (Bug 4D): the account's open manual orders on Horizon,
// with cancel + in-place modify. Auto-refreshes every 30s while mounted.
function offerLabel(spec: string): string {
  return store.tokenFor(spec).code;
}

const REFRESH_MS = 30_000;
let offersTimer: ReturnType<typeof setInterval> | null = null;
const refreshingOffers = ref(false);
async function refreshOffers(): Promise<void> {
  refreshingOffers.value = true;
  try {
    await store.loadOffers();
  } finally {
    refreshingOffers.value = false;
  }
}
onMounted(() => {
  void refreshOffers();
  offersTimer = setInterval(() => void store.loadOffers(), REFRESH_MS);
});
onBeforeUnmount(() => {
  if (offersTimer) clearInterval(offersTimer);
});

/** Per-row inline error (e.g. "could not cancel — already filled?"). */
const rowError = ref<Record<string, string>>({});

// Cancel: first tap arms an inline "cancel this order?" confirm; the explicit
// confirm button submits. Errors surface inline on the row, never silently.
const confirmingCancel = ref<string | null>(null);
const cancelling = ref<string | null>(null);
async function confirmCancel(id: string): Promise<void> {
  cancelling.value = id;
  rowError.value = { ...rowError.value, [id]: "" };
  try {
    const err = await store.cancelOffer(id);
    if (err) {
      rowError.value = { ...rowError.value, [id]: t("manualTrade.activeOrders.cancelFailed") };
    }
  } finally {
    cancelling.value = null;
    confirmingCancel.value = null;
  }
}

// Modify: opens an inline edit form below the row (pre-filled with the current
// price + remaining amount), applies the same balance pre-check as the Place
// Order form, then asks for an explicit confirm with a summary before submit.
const modifyingId = ref<string | null>(null);
const modifyPrice = ref("");
const modifyAmount = ref("");
const modifyConfirmStep = ref(false);
const modifySubmitting = ref(false);
function openModify(o: OpenOffer): void {
  confirmingCancel.value = null;
  modifyingId.value = o.id;
  modifyPrice.value = o.price;
  modifyAmount.value = o.amount;
  modifyConfirmStep.value = false;
  rowError.value = { ...rowError.value, [o.id]: "" };
}
function closeModify(): void {
  modifyingId.value = null;
  modifyConfirmStep.value = false;
}
const modifyTarget = computed<OpenOffer | null>(
  () => store.openOffers.find((o) => o.id === modifyingId.value) ?? null,
);
// Only the INCREASE over the resting remainder needs free balance — the offer
// already reserves its current amount (same rule the backend re-checks).
const modifyInsufficient = computed(() => {
  const o = modifyTarget.value;
  if (!o) return false;
  const delta = Number(modifyAmount.value) - Number(o.amount);
  return delta > 0 && delta > store.heldBalance(o.selling);
});
const modifyValid = computed(
  () =>
    Number(modifyAmount.value) > 0 &&
    Number(modifyPrice.value) > 0 &&
    !modifyInsufficient.value,
);
async function submitModify(): Promise<void> {
  const o = modifyTarget.value;
  if (!o || !modifyValid.value || modifySubmitting.value) return;
  if (!modifyConfirmStep.value) {
    // First click: show the "new price X, new amount Y — confirm?" summary.
    modifyConfirmStep.value = true;
    return;
  }
  modifySubmitting.value = true;
  try {
    const err = await store.modifyOffer(o.id, {
      amount: modifyAmount.value.trim(),
      price: modifyPrice.value.trim(),
    });
    if (err) {
      rowError.value = {
        ...rowError.value,
        [o.id]: t("manualTrade.activeOrders.modifyFailed", { error: err }),
      };
      modifyConfirmStep.value = false;
    } else {
      closeModify();
    }
  } finally {
    modifySubmitting.value = false;
  }
}
</script>

<template>
  <div class="grid">
    <section class="panel">
      <h2>{{ t("manualTrade.orderBook") }}</h2>
      <div class="market-controls">
        <AssetSelect
          v-model="sellToken"
          class="sel-pair"
          :options="store.heldTokens"
          :placeholder="t('manualTrade.placeholders.sellToken')"
          :aria-label="t('manualTrade.aria.pairSellToken')"
        />
        <span class="sep">→</span>
        <AssetSelect
          v-model="buyToken"
          class="sel-pair"
          :options="store.universe"
          :placeholder="t('manualTrade.placeholders.buyToken')"
          :aria-label="t('manualTrade.aria.pairBuyToken')"
        />
        <button class="btn" @click="refresh">{{ t("manualTrade.actions.refresh") }}</button>
      </div>
      <p v-if="store.marketError" class="violations">{{ store.marketError }}</p>

      <div class="topbook">
        <div>{{ t("manualTrade.bid") }} <span class="mono pos">{{ fmtNum(store.market?.bestBid, 7) }}</span></div>
        <div>{{ t("manualTrade.ask") }} <span class="mono neg">{{ fmtNum(store.market?.bestAsk, 7) }}</span></div>
        <div>
          {{ t("manualTrade.spread") }}<InfoTip :text="TIPS.spread" :label="t('manualTrade.aria.whatIsSpread')" :learn-more="LESSONS.spread" />
          <span class="mono">
            {{ store.market?.spreadBps != null ? fmtNum(store.market.spreadBps, 1) + " bps" : "-" }}
          </span>
        </div>
      </div>

      <div class="book">
        <div>
          <h3>{{ t("manualTrade.bids") }}</h3>
          <ul class="levels bids">
            <li
              v-for="(lv, i) in store.market?.bids ?? []"
              :key="'b' + i"
              class="book-level"
              :title="t('manualTrade.aria.clickToFill')"
              @click="fillFromBook(lv.price)"
            >
              <span class="px">{{ fmtNum(lv.price, 7) }}</span>
              <span class="amt">{{ fmtNum(lv.amount) }}</span>
            </li>
          </ul>
        </div>
        <div>
          <h3>{{ t("manualTrade.asks") }}</h3>
          <ul class="levels asks">
            <li v-for="(lv, i) in store.market?.asks ?? []" :key="'a' + i">
              <span class="px">{{ fmtNum(lv.price, 7) }}</span>
              <span class="amt">{{ fmtNum(lv.amount) }}</span>
            </li>
          </ul>
        </div>
      </div>

    </section>

    <section class="panel">
      <h2>{{ t("manualTrade.placeOrder") }}</h2>
      <div class="order-form">
        <div class="order-toggles">
          <div class="segmented order-type">
            <button class="seg" :class="{ active: orderType === 'limit' }" @click="orderType = 'limit'">
              {{ t("manualTrade.limit") }}
            </button>
            <button class="seg" :class="{ active: orderType === 'market' }" @click="orderType = 'market'">
              {{ t("manualTrade.market") }}
            </button>
          </div>
          <InfoTip :text="TIPS.orderType" :label="t('manualTrade.aria.orderType')" placement="right" />
        </div>

        <div class="trade-summary">
          <div class="trade-side sell">
            <span class="k">{{ t("manualTrade.youSell") }}</span>
            <span class="v">
              {{ amountNum > 0 ? fmtNum(amountNum, 7) : "—" }}
              <span class="unit">{{ sellCode }}</span>
            </span>
          </div>
          <div class="trade-arrow" aria-hidden="true">⇄</div>
          <div class="trade-side buy">
            <span class="k">{{ t("manualTrade.youBuy") }}</span>
            <span class="v">
              {{ youBuyAmount != null ? fmtNum(youBuyAmount, 7) : "—" }}
              <span class="unit">{{ buyCode }}</span>
            </span>
          </div>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">{{ t("manualTrade.youSell") }}</span>
            <AssetSelect
              v-model="sellToken"
              :options="store.heldTokens"
              :placeholder="t('manualTrade.placeholders.heldToken')"
              :aria-label="t('manualTrade.aria.sellToken')"
              @selected="focusAmount"
            />
          </label>
          <label class="order-field">
            <span class="order-label">{{ t("manualTrade.youBuy") }}</span>
            <AssetSelect
              v-model="buyToken"
              :options="store.universe"
              :placeholder="t('manualTrade.placeholders.tokenToReceive')"
              :aria-label="t('manualTrade.aria.buyToken')"
              @selected="focusAmount"
            />
          </label>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">{{ t("manualTrade.amount") }} ({{ sellCode }})</span>
            <input
              ref="amountEl"
              v-model="amount"
              class="order-input"
              :class="{ 'input-error': insufficient }"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :aria-label="t('manualTrade.aria.sellAmount')"
            />
            <span v-if="insufficient" class="field-error">
              {{ t("manualTrade.insufficientBalance", { amount: fmtNum(available), code: sellCode }) }}
            </span>
            <span v-else class="field-help">{{ t("manualTrade.available") }}: {{ fmtNum(available) }} {{ sellCode }}</span>
          </label>
          <label class="order-field" :class="{ hidden: orderType === 'market' }">
            <span class="order-label">
              {{ t("manualTrade.price") }} ({{ buyCode }}/{{ sellCode }})<InfoTip :text="TIPS.price" :label="t('manualTrade.aria.price')" />
            </span>
            <input
              v-model="limitPrice"
              class="order-input"
              type="text"
              inputmode="decimal"
              :placeholder="pricePlaceholder"
              :aria-label="t('manualTrade.aria.limitPrice')"
              @keyup.enter="placeOrder"
            />
          </label>
          <p v-if="noMarketBook" class="violations market-note">
            {{ t("manualTrade.noLiveBook") }}
          </p>
          <p v-else-if="orderType === 'market'" class="muted market-note">
            {{ t("manualTrade.marketOrderNote") }}
            <span class="mono">{{ pricePlaceholder }}</span>.
          </p>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">
              {{ t("manualTrade.slippageTolerance") }}<InfoTip :text="TIPS.slippage" :label="t('manualTrade.aria.slippageTolerance')" :learn-more="LESSONS.slippage" />
            </span>
            <input
              v-model="slippagePct"
              class="order-input"
              type="text"
              inputmode="decimal"
              :placeholder="store.limits ? t('manualTrade.placeholders.defaultSlippage', { pct: store.limits.maxSlippageBps / 100 }) : t('manualTrade.placeholders.slippageExample')"
              :aria-label="t('manualTrade.aria.slippageTolerancePercent')"
            />
          </label>
        </div>

        <button class="order-disclosure" type="button" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? "▾" : "▸" }} {{ t("manualTrade.advanced") }}
        </button>
        <div v-if="showAdvanced" class="order-fields">
          <label class="order-field">
            <span class="order-label">
              {{ t("manualTrade.targetPrice") }}<InfoTip :text="TIPS.target" :label="t('manualTrade.aria.targetPrice')" :learn-more="LESSONS.targetPrice" />
            </span>
            <input v-model="targetPrice" class="order-input" type="text" inputmode="decimal" :placeholder="t('manualTrade.placeholders.optional')" :aria-label="t('manualTrade.aria.targetPrice')" />
          </label>
          <label class="order-field">
            <span class="order-label">
              {{ t("manualTrade.invalidationPrice") }}<InfoTip :text="TIPS.invalidation" :label="t('manualTrade.aria.invalidationPrice')" :learn-more="LESSONS.invalidationPrice" />
            </span>
            <input v-model="invalidationPrice" class="order-input" type="text" inputmode="decimal" :placeholder="t('manualTrade.placeholders.optional')" :aria-label="t('manualTrade.aria.invalidationPrice')" />
          </label>
        </div>

        <!-- Fund-safety UX fix: a concise pre-commit summary showing exactly
             what the order will do and the worst-case proceeds after slippage
             (+ platform fee, when billing is enabled) BEFORE the user can
             submit an on-chain order. -->
        <div v-if="showCommitSummary" class="commit-summary">
          <div class="commit-row">
            <span class="commit-label">{{ t("manualTrade.commitSummary.order") }}</span>
            <span class="mono">
              {{ t("manualTrade.commitSummary.sellFor", { amount: fmtNum(amountNum, 7), sellCode, buyCode }) }}
              {{ t("manualTrade.commitSummary.atPrice", { price: fmtNum(effectivePrice, 7), buyCode, sellCode }) }}
            </span>
          </div>
          <div class="commit-row">
            <span class="commit-label">
              {{ t("manualTrade.commitSummary.worstCase") }}<InfoTip :text="t('manualTrade.commitSummary.worstCaseTip')" :label="t('manualTrade.aria.worstCase')" />
            </span>
            <span class="mono commit-worst-case">
              {{ t("manualTrade.commitSummary.youReceiveAtLeast", { amount: fmtNum(worstCaseReceive, 7), code: buyCode }) }}
            </span>
          </div>
          <p class="muted commit-note">
            {{ t("manualTrade.commitSummary.slippageBasis", { bps: fmtNum(effectiveSlippageBps, 0) }) }}
            {{
              estFeeAmount != null
                ? t("manualTrade.commitSummary.feeIncluded", { amount: fmtNum(estFeeAmount, 7), code: buyCode, pct: fmtNum(feeFraction * 100, 2) })
                : t("manualTrade.commitSummary.networkFeeNote")
            }}
          </p>
        </div>

        <button
          class="btn primary order-submit"
          :disabled="!orderValid || store.placingOrder"
          @click="placeOrder"
        >
          {{ store.placingOrder ? t("manualTrade.placing") : t("manualTrade.placeOrderBtn") }}
        </button>

        <p v-if="orderResult" class="order-result" :class="orderResult.ok ? 'pos' : 'neg'">
          {{ orderResult.text }}
        </p>
        <p class="muted order-hint">
          {{ t("manualTrade.orderHint") }}
        </p>
      </div>

      <!-- Bug 4D: Active Orders — the account's open manual orders fetched
           from the Stellar network, directly below the Place Order form.
           Auto-refreshes every 30s; Cancel and Modify act on-chain. -->
      <div class="ao-head">
        <h3>{{ t("manualTrade.activeOrders.title") }}</h3>
        <button class="btn ao-btn" :disabled="refreshingOffers" @click="refreshOffers">
          {{ refreshingOffers ? "…" : t("manualTrade.actions.refresh") }}
        </button>
      </div>
      <p class="muted ao-intro">{{ t("manualTrade.activeOrders.intro") }}</p>
      <p v-if="store.openOffers.length === 0" class="muted">
        {{ t("manualTrade.activeOrders.empty") }}
      </p>
      <div v-for="o in store.openOffers" :key="o.id" class="card ao-row">
        <div class="row">
          <span class="headline">
            {{ offerLabel(o.selling) }} → {{ offerLabel(o.buying) }}
            <span class="muted ao-type">{{ t("manualTrade.activeOrders.typeLimit") }}</span>
          </span>
          <span class="ao-status" :class="o.status === 'PARTIALLY_FILLED' ? 'warn' : 'pos'">
            {{
              o.status === "PARTIALLY_FILLED"
                ? t("manualTrade.activeOrders.statusPartial")
                : t("manualTrade.activeOrders.statusOpen")
            }}
          </span>
        </div>
        <div class="ao-details mono">
          <span>
            {{ o.original ? fmtNum(o.original) : fmtNum(o.amount) }} {{ offerLabel(o.selling) }}
            <template v-if="o.original && o.original !== o.amount">
              · {{ t("manualTrade.activeOrders.remaining", { amount: fmtNum(o.amount) }) }}
            </template>
          </span>
          <span>@ {{ fmtNum(o.price, 7) }} {{ offerLabel(o.buying) }}/{{ offerLabel(o.selling) }}</span>
          <span v-if="o.filledPct != null">
            {{ t("manualTrade.activeOrders.filled", { pct: fmtNum(o.filledPct, 1) }) }}
          </span>
          <span v-if="o.placedAt" class="muted">
            {{ t("manualTrade.activeOrders.placed") }}: {{ dateTimeStr(o.placedAt) }}
          </span>
        </div>

        <p v-if="rowError[o.id]" class="violations">{{ rowError[o.id] }}</p>

        <!-- Default row actions -->
        <div v-if="confirmingCancel !== o.id && modifyingId !== o.id" class="ao-actions">
          <button class="btn ao-btn" @click="openModify(o)">
            {{ t("manualTrade.activeOrders.modify") }}
          </button>
          <button
            class="btn danger ao-btn"
            :disabled="store.killSwitch || cancelling === o.id"
            @click="confirmingCancel = o.id"
          >
            {{ t("manualTrade.actions.cancel") }}
          </button>
        </div>

        <!-- Inline cancel confirmation -->
        <div v-else-if="confirmingCancel === o.id" class="ao-confirm">
          <p class="warn-text">{{ t("manualTrade.activeOrders.cancelConfirm") }}</p>
          <div class="ao-actions">
            <button
              class="btn danger ao-btn"
              :disabled="cancelling === o.id"
              @click="confirmCancel(o.id)"
            >
              {{ cancelling === o.id ? "…" : t("manualTrade.activeOrders.confirmCancel") }}
            </button>
            <button class="btn ao-btn" @click="confirmingCancel = null">
              {{ t("manualTrade.activeOrders.keep") }}
            </button>
          </div>
        </div>

        <!-- Inline modify form (pre-filled with current price + remaining) -->
        <div v-else class="ao-modify">
          <div class="order-fields">
            <label class="order-field">
              <span class="order-label">
                {{ t("manualTrade.activeOrders.newPrice") }} ({{ offerLabel(o.buying) }}/{{ offerLabel(o.selling) }})
              </span>
              <input v-model="modifyPrice" class="order-input" type="text" inputmode="decimal" />
            </label>
            <label class="order-field">
              <span class="order-label">
                {{ t("manualTrade.activeOrders.newAmount") }} ({{ offerLabel(o.selling) }})
              </span>
              <input
                v-model="modifyAmount"
                class="order-input"
                :class="{ 'input-error': modifyInsufficient }"
                type="text"
                inputmode="decimal"
              />
              <span v-if="modifyInsufficient" class="field-error">
                {{ t("manualTrade.insufficientBalance", { amount: fmtNum(store.heldBalance(o.selling)), code: offerLabel(o.selling) }) }}
              </span>
            </label>
          </div>
          <p v-if="modifyConfirmStep" class="warn-text">
            {{ t("manualTrade.activeOrders.modifyConfirm", { price: modifyPrice, amount: modifyAmount }) }}
          </p>
          <div class="ao-actions">
            <button
              class="btn primary ao-btn"
              :disabled="!modifyValid || modifySubmitting"
              @click="submitModify"
            >
              {{
                modifySubmitting
                  ? "…"
                  : modifyConfirmStep
                    ? t("manualTrade.activeOrders.confirmModify")
                    : t("manualTrade.activeOrders.modify")
              }}
            </button>
            <button
              class="btn ao-btn"
              @click="modifyConfirmStep ? (modifyConfirmStep = false) : closeModify()"
            >
              {{ modifyConfirmStep ? t("manualTrade.activeOrders.back") : t("manualTrade.actions.cancel") }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.market-controls .asset-select.sel-pair {
  flex: 1 1 170px;
  min-width: 140px;
}
.order-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-toggles {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.order-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 480px) {
  .order-fields {
    grid-template-columns: 1fr;
  }
}
.order-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
}
.order-input {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-family: ui-monospace, monospace;
  width: 100%;
}
.order-input:focus {
  outline: none;
  border-color: var(--accent);
}
.order-input.input-error {
  border-color: var(--neg);
}
.field-help {
  font-size: 11px;
  color: var(--muted);
}
.field-error {
  font-size: 11px;
  color: var(--neg);
}
.market-note {
  font-size: 11px;
  margin: 0;
  align-self: end;
}
.commit-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.commit-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.commit-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.commit-worst-case {
  font-weight: 700;
}
.commit-note {
  font-size: 11px;
  margin: 0;
}
.order-disclosure {
  align-self: flex-start;
  background: none;
  border: 0;
  color: var(--muted);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}
.order-disclosure:hover {
  color: var(--text);
}
.order-submit {
  align-self: flex-start;
}
.order-result {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}
.order-hint {
  font-size: 11px;
  margin: 0;
}
.book-level {
  cursor: pointer;
  border-radius: 4px;
}
.book-level:hover {
  background: rgba(91, 140, 255, 0.1);
}
/* --- Active Orders (Bug 4D) -------------------------------------------- */
.ao-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}
.ao-head h3 {
  margin: 0;
}
.ao-intro {
  font-size: 11px;
  margin: 2px 0 10px;
}
.ao-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}
.ao-type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 8px;
}
.ao-status {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.ao-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 12.5px;
}
.ao-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
/* App/Play Store touch-target floor on ALL pointer types, not just <768px. */
.ao-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 18px;
}
.warn-text {
  color: var(--warn);
  font-size: 12.5px;
  margin: 0;
}
.pos {
  color: var(--pos);
}
.warn {
  color: var(--warn);
}
</style>
