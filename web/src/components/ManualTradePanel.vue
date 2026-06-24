<script setup lang="ts">
// Manual trading workspace: a YOU SELL → YOU BUY order form (sell-side dropdown
// is held-only with live balance validation), the order book for the chosen
// pair, and the list of open (resting) orders. A manual order is always framed
// as "sell the YOU-SELL asset for the YOU-BUY asset" — base = sell, quote =
// buy, side = sell — which maps directly onto placeManualOrder.
import { computed, ref, watch } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import type { ManualOrderInput } from "../types";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";

const store = useTraderStore();

const TIPS = {
  target:
    "The price at which you want to take profit. The bot will automatically close the position when this price is reached.",
  invalidation:
    "If the price drops to this level, the trade idea is considered invalid. This is typically used to set a stop loss.",
  slippage:
    "The maximum % difference between the expected price and the actual execution price you are willing to accept.",
  spread:
    "The difference between the best buy and best sell price in the order book. A wider spread means higher implicit cost per trade.",
  orderType:
    "Limit: rests at the price you set and fills only at that price or better. Market: fills immediately against the current best price in the book.",
  price:
    "How many YOU BUY tokens you receive per 1 YOU SELL token. For a limit order it's the minimum you'll accept.",
};

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
const buyCode = computed(() => (buyToken.value ? store.tokenFor(buyToken.value).code : "token"));
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
  marketPrice.value != null ? fmtNum(marketPrice.value, 7) : "price",
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
    return { ok: false, text: `Blocked: ${o.policyViolations.join("; ")}` };
  }
  switch (o.status) {
    case "submitted":
      return { ok: true, text: "Submitted" };
    case "pending_approval":
      return { ok: true, text: "Pending approval" };
    case "proposed":
      return { ok: true, text: "Resting" };
    case "submitting":
      return { ok: true, text: "Submitting..." };
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
      <h2>Order book</h2>
      <div class="market-controls">
        <AssetSelect
          v-model="sellToken"
          class="sel-pair"
          :options="store.heldTokens"
          placeholder="sell token"
          aria-label="Pair sell token"
        />
        <span class="sep">→</span>
        <AssetSelect
          v-model="buyToken"
          class="sel-pair"
          :options="store.universe"
          placeholder="buy token"
          aria-label="Pair buy token"
        />
        <button class="btn" @click="refresh">Refresh</button>
      </div>
      <p v-if="store.marketError" class="violations">{{ store.marketError }}</p>

      <div class="topbook">
        <div>Bid <span class="mono pos">{{ fmtNum(store.market?.bestBid, 7) }}</span></div>
        <div>Ask <span class="mono neg">{{ fmtNum(store.market?.bestAsk, 7) }}</span></div>
        <div>
          Spread<InfoTip :text="TIPS.spread" label="What is spread?" />
          <span class="mono">
            {{ store.market?.spreadBps != null ? fmtNum(store.market.spreadBps, 1) + " bps" : "-" }}
          </span>
        </div>
      </div>

      <div class="book">
        <div>
          <h3>Bids</h3>
          <ul class="levels bids">
            <li
              v-for="(lv, i) in store.market?.bids ?? []"
              :key="'b' + i"
              class="book-level"
              title="Click to fill this price"
              @click="fillFromBook(lv.price)"
            >
              <span class="px">{{ fmtNum(lv.price, 7) }}</span>
              <span class="amt">{{ fmtNum(lv.amount) }}</span>
            </li>
          </ul>
        </div>
        <div>
          <h3>Asks</h3>
          <ul class="levels asks">
            <li v-for="(lv, i) in store.market?.asks ?? []" :key="'a' + i">
              <span class="px">{{ fmtNum(lv.price, 7) }}</span>
              <span class="amt">{{ fmtNum(lv.amount) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <h3>Open orders</h3>
      <ul class="levels">
        <li v-if="store.openOffers.length === 0" class="muted-row">
          <span class="muted">(no resting orders)</span>
        </li>
        <li v-for="o in store.openOffers" :key="o.id" class="oo-row">
          <span class="px">{{ offerLabel(o.selling) }} → {{ offerLabel(o.buying) }}</span>
          <span class="amt">{{ fmtNum(o.amount) }} @ {{ fmtNum(o.price, 7) }}</span>
          <button
            class="btn oo-cancel"
            :disabled="store.isReadOnly || store.killSwitch || cancelling === o.id"
            @click="cancel(o.id)"
          >
            {{ cancelling === o.id ? "…" : "Cancel" }}
          </button>
        </li>
      </ul>
    </section>

    <section class="panel">
      <h2>Place order</h2>
      <div class="order-form">
        <div class="order-toggles">
          <div class="segmented order-type">
            <button class="seg" :class="{ active: orderType === 'limit' }" @click="orderType = 'limit'">
              Limit
            </button>
            <button class="seg" :class="{ active: orderType === 'market' }" @click="orderType = 'market'">
              Market
            </button>
          </div>
          <InfoTip :text="TIPS.orderType" label="Order type" placement="right" />
        </div>

        <div class="trade-summary">
          <div class="trade-side sell">
            <span class="k">You sell</span>
            <span class="v">
              {{ amountNum > 0 ? fmtNum(amountNum, 7) : "—" }}
              <span class="unit">{{ sellCode }}</span>
            </span>
          </div>
          <div class="trade-arrow" aria-hidden="true">⇄</div>
          <div class="trade-side buy">
            <span class="k">You buy</span>
            <span class="v">
              {{ youBuyAmount != null ? fmtNum(youBuyAmount, 7) : "—" }}
              <span class="unit">{{ buyCode }}</span>
            </span>
          </div>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">You sell</span>
            <AssetSelect
              v-model="sellToken"
              :options="store.heldTokens"
              placeholder="held token"
              aria-label="Sell token"
            />
          </label>
          <label class="order-field">
            <span class="order-label">You buy</span>
            <AssetSelect
              v-model="buyToken"
              :options="store.universe"
              placeholder="token to receive"
              aria-label="Buy token"
            />
          </label>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">Amount ({{ sellCode }})</span>
            <input
              v-model="amount"
              class="order-input"
              :class="{ 'input-error': insufficient }"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              aria-label="sell amount"
            />
            <span v-if="insufficient" class="field-error">
              Insufficient balance. You have {{ fmtNum(available) }} {{ sellCode }} available.
            </span>
            <span v-else class="field-help">Available: {{ fmtNum(available) }} {{ sellCode }}</span>
          </label>
          <label class="order-field" :class="{ hidden: orderType === 'market' }">
            <span class="order-label">
              Price ({{ buyCode }}/{{ sellCode }})<InfoTip :text="TIPS.price" label="Price" />
            </span>
            <input
              v-model="limitPrice"
              class="order-input"
              type="text"
              inputmode="decimal"
              :placeholder="pricePlaceholder"
              aria-label="limit price"
              @keyup.enter="placeOrder"
            />
          </label>
          <p v-if="noMarketBook" class="violations market-note">
            No live order book for this pair — switch to Limit or pick another pair.
          </p>
          <p v-else-if="orderType === 'market'" class="muted market-note">
            Market order — fills at the current best price
            <span class="mono">{{ pricePlaceholder }}</span>.
          </p>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">
              Slippage tolerance (%)<InfoTip :text="TIPS.slippage" label="Slippage tolerance" />
            </span>
            <input
              v-model="slippagePct"
              class="order-input"
              type="text"
              inputmode="decimal"
              :placeholder="store.limits ? `default ${store.limits.maxSlippageBps / 100}%` : 'e.g. 0.5'"
              aria-label="slippage tolerance percent"
            />
          </label>
        </div>

        <button class="order-disclosure" type="button" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? "▾" : "▸" }} Advanced
        </button>
        <div v-if="showAdvanced" class="order-fields">
          <label class="order-field">
            <span class="order-label">
              Target price<InfoTip :text="TIPS.target" label="Target price" />
            </span>
            <input v-model="targetPrice" class="order-input" type="text" inputmode="decimal" placeholder="optional" aria-label="target price" />
          </label>
          <label class="order-field">
            <span class="order-label">
              Invalidation price<InfoTip :text="TIPS.invalidation" label="Invalidation price" />
            </span>
            <input v-model="invalidationPrice" class="order-input" type="text" inputmode="decimal" placeholder="optional" aria-label="invalidation price" />
          </label>
        </div>

        <button
          class="btn primary order-submit"
          :disabled="!orderValid || store.placingOrder"
          @click="placeOrder"
        >
          {{ store.placingOrder ? "Placing..." : "Place Order" }}
        </button>

        <p v-if="orderResult" class="order-result" :class="orderResult.ok ? 'pos' : 'neg'">
          {{ orderResult.text }}
        </p>
        <p class="muted order-hint">
          Manual orders bypass the AI size, daily-volume and exposure caps — trade
          any amount you hold. The safety gates (slippage, balance, kill switch)
          still apply.
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
