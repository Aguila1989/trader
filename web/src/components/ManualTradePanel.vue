<script setup lang="ts">
// Manual trading workspace: a YOU SELL → YOU BUY order form (sell-side dropdown
// is held-only with live balance validation), the order book for the chosen
// pair, and the list of open (resting) orders. A manual order is always framed
// as "sell the YOU-SELL asset for the YOU-BUY asset" — base = sell, quote =
// buy, side = sell — which maps directly onto placeManualOrder.
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import type { ManualOrderInput } from "../types";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";

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

// Open orders (all the account's resting offers).
function offerLabel(spec: string): string {
  return store.tokenFor(spec).code;
}
const cancelling = ref<string | null>(null);
async function cancel(id: string): Promise<void> {
  cancelling.value = id;
  try {
    await store.cancelOffer(id);
  } finally {
    cancelling.value = null;
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
          {{ t("manualTrade.spread") }}<InfoTip :text="TIPS.spread" :label="t('manualTrade.aria.whatIsSpread')" />
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

      <h3>{{ t("manualTrade.openOrders") }}</h3>
      <ul class="levels">
        <li v-if="store.openOffers.length === 0" class="muted-row">
          <span class="muted">{{ t("manualTrade.noRestingOrders") }}</span>
        </li>
        <li v-for="o in store.openOffers" :key="o.id" class="oo-row">
          <span class="px">{{ offerLabel(o.selling) }} → {{ offerLabel(o.buying) }}</span>
          <span class="amt">{{ fmtNum(o.amount) }} @ {{ fmtNum(o.price, 7) }}</span>
          <button
            class="btn oo-cancel"
            :disabled="store.isReadOnly || store.killSwitch || cancelling === o.id"
            @click="cancel(o.id)"
          >
            {{ cancelling === o.id ? "…" : t("manualTrade.actions.cancel") }}
          </button>
        </li>
      </ul>
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
            />
          </label>
          <label class="order-field">
            <span class="order-label">{{ t("manualTrade.youBuy") }}</span>
            <AssetSelect
              v-model="buyToken"
              :options="store.universe"
              :placeholder="t('manualTrade.placeholders.tokenToReceive')"
              :aria-label="t('manualTrade.aria.buyToken')"
            />
          </label>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">{{ t("manualTrade.amount") }} ({{ sellCode }})</span>
            <input
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
              {{ t("manualTrade.slippageTolerance") }}<InfoTip :text="TIPS.slippage" :label="t('manualTrade.aria.slippageTolerance')" />
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
              {{ t("manualTrade.targetPrice") }}<InfoTip :text="TIPS.target" :label="t('manualTrade.aria.targetPrice')" />
            </span>
            <input v-model="targetPrice" class="order-input" type="text" inputmode="decimal" :placeholder="t('manualTrade.placeholders.optional')" :aria-label="t('manualTrade.aria.targetPrice')" />
          </label>
          <label class="order-field">
            <span class="order-label">
              {{ t("manualTrade.invalidationPrice") }}<InfoTip :text="TIPS.invalidation" :label="t('manualTrade.aria.invalidationPrice')" />
            </span>
            <input v-model="invalidationPrice" class="order-input" type="text" inputmode="decimal" :placeholder="t('manualTrade.placeholders.optional')" :aria-label="t('manualTrade.aria.invalidationPrice')" />
          </label>
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
.oo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.oo-cancel {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 12px;
}
</style>
