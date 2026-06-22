<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import type { ManualOrderInput } from "../types";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";

const store = useTraderStore();
const base = ref("XLM");
const quote = ref("");

// Plain-language explanations surfaced via the ℹ icons.
const TIPS = {
  target:
    "The price at which you want to take profit. The bot will automatically close the position when this price is reached.",
  invalidation:
    "If the price drops to this level, the trade idea is considered invalid. This is typically used to set a stop loss.",
  slippage:
    "The maximum % difference between the expected price and the actual execution price you are willing to accept.",
  cap: "The maximum amount the AI is allowed to trade in a single order. Manual trades are not subject to this limit.",
  spread:
    "The difference between the best buy and best sell price in the order book. A wider spread means higher implicit cost per trade.",
  orderType:
    "Limit: rests at the price you set and fills only at that price or better. Market: fills immediately against the current best price in the book.",
  limitPrice:
    "The price (in the quote asset) you are willing to trade at. For a buy it's the most you'll pay; for a sell it's the least you'll accept.",
};

// Token options come from the curated/whitelisted universe (with labels).
const tokenOptions = computed(() => store.universe);
const tokenChips = computed(() =>
  store.universe.filter((t) => t.spec.toUpperCase() !== "XLM"),
);

const baseCode = computed(() => store.tokenFor(base.value).code);
const quoteCode = computed(() =>
  quote.value ? store.tokenFor(quote.value).code : "quote",
);

// Only funded balances are worth showing; a Stellar account keeps a zero-amount
// line for every trustline, so the raw list is mostly empty rows.
const fundedBalances = computed(() =>
  store.balances.filter((b) => Number(b.balance) > 0),
);
const emptyTrustlines = computed(
  () => store.balances.length - fundedBalances.value.length,
);

const change24h = computed(() => store.market?.stats?.change24hPct ?? null);
const change24hText = computed(() => {
  const c = change24h.value;
  return c == null ? "-" : `${c >= 0 ? "+" : ""}${c.toFixed(2)}%`;
});

const limitRows = computed(() => {
  const l = store.limits;
  if (!l) return [];
  return [
    ["Max / trade (std)", fmtNum(l.maxAmountPerTrade), TIPS.cap],
    ["Max / trade (high tier)", fmtNum(l.maxAmountPerTradeHigh), TIPS.cap],
    ["Max daily volume", fmtNum(l.maxDailyVolume), ""],
    ["Max trades / day", String(l.maxTradesPerDay), ""],
    ["Max daily loss", fmtNum(l.maxDailyLoss), ""],
    ["Max slippage", `${l.maxSlippageBps} bps`, TIPS.slippage],
    ["Cooldown", `${l.cooldownSeconds} s`, ""],
  ] as const;
});

function refresh(): void {
  if (!quote.value.trim()) return;
  void store.refreshMarket(base.value.trim(), quote.value.trim());
}

function ask(): void {
  if (!quote.value.trim()) {
    store.reasoning = "Pick a quote asset first.";
    return;
  }
  void store.analyze(base.value.trim(), quote.value.trim());
}

// Auto-pull market data whenever the selected pair changes, so the YOU SELL /
// YOU BUY summary and the market-price option have a live book to work with.
watch([base, quote], () => {
  if (base.value && quote.value && base.value !== quote.value) refresh();
});

// --- manual order form -----------------------------------------------------
const orderSide = ref<"buy" | "sell">("buy");
const orderType = ref<"limit" | "market">("limit");
const orderAmount = ref("");
const orderLimitPrice = ref("");
const slippagePct = ref("");
const showAdvanced = ref(false);
const orderTargetPrice = ref("");
const orderInvalidationPrice = ref("");

// True only when the loaded book is for the CURRENTLY-selected pair. refresh()
// is async, so between a pair switch and its response store.market still holds
// the previous pair — gating on this stops the summary/funds check using a
// stale price for the wrong market.
const bookMatchesPair = computed(
  () =>
    !!store.market &&
    store.market.base === base.value &&
    store.market.quote === quote.value,
);

// Best price available from the live book for the chosen side.
const marketPrice = computed<number | null>(() => {
  if (!bookMatchesPair.value) return null;
  const m = store.market;
  const px = orderSide.value === "buy" ? m?.bestAsk : m?.bestBid;
  return px != null ? px : null;
});
const limitPlaceholder = computed(() =>
  marketPrice.value != null ? fmtNum(marketPrice.value, 7) : "limit price",
);

// The price actually used: the live best price for a market order, else the
// typed limit price (falling back to the live best while the field is empty).
const effectivePrice = computed<number | null>(() => {
  if (orderType.value === "market") return marketPrice.value;
  const typed = Number(orderLimitPrice.value);
  if (orderLimitPrice.value.trim() && Number.isFinite(typed) && typed > 0) {
    return typed;
  }
  return marketPrice.value;
});

const amountNum = computed(() => Number(orderAmount.value));
const priceNum = computed(() => effectivePrice.value);

// The two sides of the trade, recomputed live. A BUY pays quote to receive
// base; a SELL gives base to receive quote.
const youSell = computed<{ amount: number | null; code: string; spec: string }>(
  () => {
    const amt = amountNum.value;
    const px = priceNum.value;
    const ok = Number.isFinite(amt) && amt > 0 && px != null && px > 0;
    if (orderSide.value === "buy") {
      return { amount: ok ? amt * px! : null, code: quoteCode.value, spec: quote.value };
    }
    return { amount: ok ? amt : null, code: baseCode.value, spec: base.value };
  },
);
const youBuy = computed<{ amount: number | null; code: string; spec: string }>(
  () => {
    const amt = amountNum.value;
    const px = priceNum.value;
    const ok = Number.isFinite(amt) && amt > 0 && px != null && px > 0;
    if (orderSide.value === "buy") {
      return { amount: ok ? amt : null, code: baseCode.value, spec: base.value };
    }
    return { amount: ok ? amt * px! : null, code: quoteCode.value, spec: quote.value };
  },
);

const pairValid = computed(
  () => !!base.value && !!quote.value && base.value !== quote.value,
);
const orderValid = computed(
  () =>
    pairValid.value &&
    Number.isFinite(amountNum.value) &&
    amountNum.value > 0 &&
    priceNum.value != null &&
    priceNum.value > 0,
);

// Client-side funds check: the asset you SELL must not exceed what you hold.
const heldOfSold = computed(() => store.heldBalance(youSell.value.spec));
const insufficientFunds = computed(
  () =>
    orderValid.value &&
    youSell.value.amount != null &&
    youSell.value.amount > heldOfSold.value,
);
const fundsError = computed(() => {
  if (!insufficientFunds.value || youSell.value.amount == null) return "";
  return `Insufficient ${youSell.value.code}: you hold ${fmtNum(
    heldOfSold.value,
  )} but this order needs ${fmtNum(youSell.value.amount, 7)}.`;
});

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
    case "blocked":
    case "rejected":
      return { ok: false, text: "Blocked" };
    case "failed":
      return { ok: false, text: o.error || "Failed" };
    default:
      return { ok: true, text: o.status };
  }
});

// Tap a book level to prefill the order form (limit): an ask is where you'd
// BUY, a bid is where you'd SELL.
function fillFromBook(price: string, side: "buy" | "sell"): void {
  orderSide.value = side;
  orderType.value = "limit";
  orderLimitPrice.value = price;
}

async function placeOrder(): Promise<void> {
  if (!orderValid.value || insufficientFunds.value || store.placingOrder) return;
  const input: ManualOrderInput = {
    base: base.value.trim(),
    quote: quote.value.trim(),
    side: orderSide.value,
    amount: orderAmount.value.trim(),
    limitPrice: String(priceNum.value),
  };
  const slip = Number(slippagePct.value);
  if (slippagePct.value.trim() && Number.isFinite(slip) && slip > 0) {
    input.maxSlippageBps = Math.round(slip * 100); // percent → basis points
  }
  if (orderTargetPrice.value.trim()) input.targetPrice = orderTargetPrice.value.trim();
  if (orderInvalidationPrice.value.trim()) {
    input.invalidationPrice = orderInvalidationPrice.value.trim();
  }
  await store.placeOrder(input);
}
</script>

<template>
  <div class="grid">
    <section class="panel">
      <h2>Market</h2>
      <div class="market-controls">
        <AssetSelect
          v-model="base"
          class="sel-base"
          :options="tokenOptions"
          aria-label="Base asset"
        />
        <span class="sep">/</span>
        <AssetSelect
          v-model="quote"
          class="sel-quote"
          :options="tokenOptions"
          placeholder="Pick a quote token"
          aria-label="Quote asset"
        />
        <button class="btn" @click="refresh">Refresh</button>
        <button
          class="btn primary"
          :disabled="store.analyzing || store.scanning"
          @click="ask"
        >
          Ask AI
        </button>
        <button
          class="btn accent"
          :disabled="store.analyzing || store.scanning"
          @click="store.scanChain()"
        >
          {{ store.scanning ? "Scanning..." : "Scan chain" }}
        </button>
      </div>

      <p v-if="store.marketError" class="violations">{{ store.marketError }}</p>

      <div class="topbook">
        <div>Bid <span class="mono pos">{{ fmtNum(store.market?.bestBid) }}</span></div>
        <div>Ask <span class="mono neg">{{ fmtNum(store.market?.bestAsk) }}</span></div>
        <div>
          Spread<InfoTip :text="TIPS.spread" label="What is spread?" />
          <span class="mono">
            {{ store.market?.spreadBps != null ? fmtNum(store.market.spreadBps, 1) + " bps" : "-" }}
          </span>
        </div>
      </div>

      <div v-if="store.market" class="topbook">
        <div>
          24h
          <span class="mono" :class="{ pos: (change24h ?? 0) >= 0, neg: (change24h ?? 0) < 0 }">
            {{ change24hText }}
          </span>
        </div>
        <div>High <span class="mono">{{ fmtNum(store.market.stats?.high24h, 7) }}</span></div>
        <div>Low <span class="mono">{{ fmtNum(store.market.stats?.low24h, 7) }}</span></div>
        <div>Vol <span class="mono">{{ fmtNum(store.market.stats?.baseVolume24h) }}</span></div>
      </div>

      <div class="book">
        <div>
          <h3>Bids</h3>
          <ul class="levels bids">
            <li
              v-for="(lv, i) in store.market?.bids ?? []"
              :key="'b' + i"
              class="book-level"
              @click="fillFromBook(lv.price, 'sell')"
            >
              <span class="px">{{ fmtNum(lv.price, 7) }}</span>
              <span class="amt">{{ fmtNum(lv.amount) }}</span>
            </li>
          </ul>
        </div>
        <div>
          <h3>Asks</h3>
          <ul class="levels asks">
            <li
              v-for="(lv, i) in store.market?.asks ?? []"
              :key="'a' + i"
              class="book-level"
              @click="fillFromBook(lv.price, 'buy')"
            >
              <span class="px">{{ fmtNum(lv.price, 7) }}</span>
              <span class="amt">{{ fmtNum(lv.amount) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <h3>Recent trades</h3>
      <ul class="levels">
        <li v-for="t in store.market?.recentTrades ?? []" :key="t.id">
          <span class="px">{{ t.price || "-" }}</span>
          <span class="amt">{{ fmtNum(t.baseAmount) }}</span>
        </li>
      </ul>
    </section>

    <section class="panel">
      <h2>AI read</h2>
      <div class="reasoning" :class="{ loading: store.analyzing || store.scanning }">
        {{
          store.reasoning ||
          "Pick a pair and hit “Ask AI”, or “Scan chain” to sweep the reputable-token universe."
        }}
      </div>

      <h3>Balances</h3>
      <ul class="levels">
        <li v-if="fundedBalances.length === 0" class="muted-row">
          <span class="muted">(none funded)</span>
        </li>
        <li v-for="b in fundedBalances" :key="b.asset">
          <span class="px">{{ store.tokenFor(b.asset).code }}</span>
          <span class="amt">{{ fmtNum(b.balance) }}</span>
        </li>
      </ul>
      <p v-if="emptyTrustlines > 0" class="muted empty-tl">
        + {{ emptyTrustlines }} empty trustline{{ emptyTrustlines === 1 ? "" : "s" }}
      </p>

      <h3>Place order</h3>
      <div class="order-form">
        <div class="order-toggles">
          <div class="segmented order-side">
            <button class="seg" :class="{ active: orderSide === 'buy' }" @click="orderSide = 'buy'">
              Buy
            </button>
            <button
              class="seg live"
              :class="{ active: orderSide === 'sell' }"
              @click="orderSide = 'sell'"
            >
              Sell
            </button>
          </div>
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

        <!-- Always-visible YOU SELL / YOU BUY summary -->
        <div class="trade-summary">
          <div class="trade-side sell">
            <span class="k">You sell</span>
            <span class="v">
              {{ youSell.amount != null ? fmtNum(youSell.amount, 7) : "—" }}
              <span class="unit">{{ youSell.code }}</span>
            </span>
          </div>
          <div class="trade-arrow" aria-hidden="true">⇄</div>
          <div class="trade-side buy">
            <span class="k">You buy</span>
            <span class="v">
              {{ youBuy.amount != null ? fmtNum(youBuy.amount, 7) : "—" }}
              <span class="unit">{{ youBuy.code }}</span>
            </span>
          </div>
        </div>

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">Amount ({{ baseCode }})</span>
            <input
              v-model="orderAmount"
              class="order-input"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              aria-label="order amount"
            />
          </label>
          <label class="order-field" :class="{ hidden: orderType === 'market' }">
            <span class="order-label">
              Limit price ({{ quoteCode }})<InfoTip :text="TIPS.limitPrice" label="Limit price" />
            </span>
            <input
              v-model="orderLimitPrice"
              class="order-input"
              type="text"
              inputmode="decimal"
              :placeholder="limitPlaceholder"
              aria-label="order limit price"
              @keyup.enter="placeOrder"
            />
          </label>
          <p v-if="orderType === 'market'" class="muted market-note">
            Market order — fills at the current best price
            <span class="mono">{{ limitPlaceholder }}</span> {{ quoteCode }}.
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
              :placeholder="store.limits ? `default ${(store.limits.maxSlippageBps / 100)}%` : 'e.g. 0.5'"
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
            <input
              v-model="orderTargetPrice"
              class="order-input"
              type="text"
              inputmode="decimal"
              placeholder="optional"
              aria-label="target price"
            />
          </label>
          <label class="order-field">
            <span class="order-label">
              Invalidation price<InfoTip :text="TIPS.invalidation" label="Invalidation price" />
            </span>
            <input
              v-model="orderInvalidationPrice"
              class="order-input"
              type="text"
              inputmode="decimal"
              placeholder="optional"
              aria-label="invalidation price"
            />
          </label>
        </div>

        <button
          class="btn primary order-submit"
          :disabled="!orderValid || insufficientFunds || store.placingOrder"
          @click="placeOrder"
        >
          {{ store.placingOrder ? "Placing..." : "Place order" }}
        </button>

        <p v-if="fundsError" class="violations">{{ fundsError }}</p>
        <p v-if="orderResult" class="order-result" :class="orderResult.ok ? 'pos' : 'neg'">
          {{ orderResult.text }}
        </p>

        <p class="muted order-hint">
          Manual orders bypass the size, daily-volume and exposure caps - trade
          any amount. They're still subject to the safety gates (slippage,
          daily-loss halt, kill switch, sufficient funds), so an order can still
          be blocked by one of those.
        </p>
      </div>

      <h3>Tokens</h3>
      <div class="token-list">
        <button
          v-for="t in tokenChips"
          :key="t.spec"
          class="btn token-chip"
          :title="t.name || t.spec"
          @click="store.openToken(t.spec)"
        >
          {{ t.code }}
        </button>
        <span v-if="tokenChips.length === 0" class="muted">(none)</span>
      </div>

      <h3>Risk limits<InfoTip :text="TIPS.cap" label="Trading cap" /></h3>
      <ul class="limits">
        <li v-for="[k, v, tip] in limitRows" :key="k">
          <span class="muted">
            {{ k }}<InfoTip v-if="tip" :text="tip" :label="k" />
          </span>
          <span class="mono">{{ v }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.market-controls .asset-select {
  flex: 1 1 220px;
  min-width: 160px;
}
.market-controls .sel-base {
  flex: 0 0 150px;
  min-width: 110px;
}
.order-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-toggles {
  display: flex;
  align-items: center;
  gap: 12px;
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
.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.token-chip {
  padding: 4px 10px;
  font-size: 12px;
}
.book-level {
  cursor: pointer;
  border-radius: 4px;
}
.book-level:hover {
  background: rgba(91, 140, 255, 0.1);
}
</style>
