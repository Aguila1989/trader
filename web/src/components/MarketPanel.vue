<script setup lang="ts">
import { computed, ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import type { ManualOrderInput } from "../types";

const store = useTraderStore();
const base = ref("XLM");
const quote = ref("");

// Only funded balances are worth showing; a Stellar account keeps a zero-amount
// line for every trustline, so the raw list is mostly empty rows. Show what's
// actually held, and note how many empty trustlines are hidden.
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
    ["Whitelist", l.assetWhitelist.join(", ") || "-"],
    ["Max / trade (std)", fmtNum(l.maxAmountPerTrade)],
    ["Max / trade (high tier)", fmtNum(l.maxAmountPerTradeHigh)],
    ["Max daily volume", fmtNum(l.maxDailyVolume)],
    ["Max trades / day", String(l.maxTradesPerDay)],
    ["Max daily loss", fmtNum(l.maxDailyLoss)],
    ["Max slippage", `${l.maxSlippageBps} bps`],
    ["Cooldown", `${l.cooldownSeconds} s`],
  ] as const;
});

function refresh(): void {
  if (!quote.value.trim()) return;
  void store.refreshMarket(base.value.trim(), quote.value.trim());
}

function ask(): void {
  if (!quote.value.trim()) {
    store.reasoning = "Enter a quote asset (e.g. USDC:G...).";
    return;
  }
  void store.analyze(base.value.trim(), quote.value.trim());
}

// --- manual order form -----------------------------------------------------
const orderSide = ref<"buy" | "sell">("buy");
const orderAmount = ref("");
const orderLimitPrice = ref("");
const showAdvanced = ref(false);
const orderTargetPrice = ref("");
const orderInvalidationPrice = ref("");

// Prefill the limit price from the live book (ask for a buy, bid for a sell)
// only while the user hasn't typed one of their own.
const limitPlaceholder = computed(() => {
  const m = store.market;
  const px = orderSide.value === "buy" ? m?.bestAsk : m?.bestBid;
  return px != null ? fmtNum(px, 7) : "limit price";
});

const effectiveLimitPrice = computed(() => {
  const typed = orderLimitPrice.value.trim();
  if (typed) return typed;
  const m = store.market;
  const px = orderSide.value === "buy" ? m?.bestAsk : m?.bestBid;
  return px != null ? String(px) : "";
});

const orderValid = computed(() => {
  const amt = Number(orderAmount.value);
  const px = Number(effectiveLimitPrice.value);
  return (
    Number.isFinite(amt) &&
    amt > 0 &&
    Number.isFinite(px) &&
    px > 0 &&
    !!quote.value.trim()
  );
});

// Classify the placed-order result into a green/red message for the UI.
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

async function placeOrder(): Promise<void> {
  if (!orderValid.value || store.placingOrder) return;
  const input: ManualOrderInput = {
    base: base.value.trim() || "XLM",
    quote: quote.value.trim(),
    side: orderSide.value,
    amount: orderAmount.value.trim(),
    limitPrice: effectiveLimitPrice.value,
  };
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
        <input v-model="base" class="base" aria-label="base asset" />
        <span class="sep">/</span>
        <input
          v-model="quote"
          class="quote"
          placeholder="USDC:G..."
          aria-label="quote asset"
          @keyup.enter="refresh"
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
          title="Scan the curated universe of reputable tokens (each vs XLM)"
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
          Spread
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
            <li v-for="(lv, i) in store.market?.bids ?? []" :key="'b' + i">
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
          <span class="px">{{ b.asset }}</span>
          <span class="amt">{{ fmtNum(b.balance) }}</span>
        </li>
      </ul>
      <p v-if="emptyTrustlines > 0" class="muted empty-tl">
        + {{ emptyTrustlines }} empty trustline{{ emptyTrustlines === 1 ? "" : "s" }}
      </p>

      <h3>Place order</h3>
      <div class="order-form">
        <div class="segmented order-side">
          <button
            class="seg"
            :class="{ active: orderSide === 'buy' }"
            @click="orderSide = 'buy'"
          >
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

        <div class="order-fields">
          <label class="order-field">
            <span class="order-label">Amount ({{ base.trim() || "XLM" }})</span>
            <input
              v-model="orderAmount"
              class="order-input"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              aria-label="order amount"
            />
          </label>
          <label class="order-field">
            <span class="order-label">Limit price ({{ quote.trim() || "quote" }})</span>
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
        </div>

        <button
          class="order-disclosure"
          type="button"
          @click="showAdvanced = !showAdvanced"
        >
          {{ showAdvanced ? "▾" : "▸" }} Advanced
        </button>
        <div v-if="showAdvanced" class="order-fields">
          <label class="order-field">
            <span class="order-label">Target price</span>
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
            <span class="order-label">Invalidation price</span>
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
          :disabled="!orderValid || store.placingOrder"
          @click="placeOrder"
        >
          {{ store.placingOrder ? "Placing..." : "Place order" }}
        </button>

        <p
          v-if="orderResult"
          class="order-result"
          :class="orderResult.ok ? 'pos' : 'neg'"
        >
          {{ orderResult.text }}
        </p>

        <p class="muted order-hint">
          Manual orders go through the same risk gates as the bot - notably the
          per-trade size cap - so a large order may come back
          "Blocked: ... exceeds ... cap". That's expected: split it or raise the cap.
        </p>
      </div>

      <h3>Risk limits</h3>
      <ul class="limits">
        <li v-for="[k, v] in limitRows" :key="k">
          <span class="muted">{{ k }}</span>
          <span class="mono">{{ v }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.order-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.order-side {
  align-self: flex-start;
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
</style>
