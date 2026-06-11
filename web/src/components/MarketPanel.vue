<script setup lang="ts">
import { computed, ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";

const store = useTraderStore();
const base = ref("XLM");
const quote = ref("");

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
        <li v-if="store.balances.length === 0" class="muted-row">
          <span class="muted">(none)</span>
        </li>
        <li v-for="b in store.balances" :key="b.asset">
          <span class="px">{{ b.asset }}</span>
          <span class="amt">{{ fmtNum(b.balance) }}</span>
        </li>
      </ul>

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
