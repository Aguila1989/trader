<script setup lang="ts">
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey, timeStr, explorerTx } from "../format";

const store = useTraderStore();

function statusText(s: string): string {
  return s.replace(/_/g, " ");
}
</script>

<style scoped>
.hl-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.conf {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--line);
}
.conf-high {
  color: var(--pos);
  border-color: #1f5e42;
}
.conf-medium {
  color: var(--warn);
  border-color: #5e4a1f;
}
.conf-low {
  color: var(--muted);
}
</style>

<template>
  <section class="panel">
    <h2>Proposals</h2>
    <div class="proposals">
      <p v-if="store.proposals.length === 0" class="muted">No proposals yet.</p>

      <div v-for="p in store.proposals" :key="p.id" class="card">
        <div class="row">
          <span class="headline">
            <span :class="p.side === 'buy' ? 'side-buy' : 'side-sell'">
              {{ p.side.toUpperCase() }}
            </span>
            {{ fmtNum(p.amount) }} {{ p.baseAsset }} @ {{ fmtNum(p.limitPrice) }}
            {{ p.quoteAsset }}
          </span>
          <span class="hl-right">
            <span v-if="p.confidence" class="conf" :class="'conf-' + p.confidence">
              {{ p.confidence }}
            </span>
            <span class="status" :class="p.status">{{ statusText(p.status) }}</span>
          </span>
        </div>

        <div class="reason">{{ p.reason }}</div>

        <div v-if="p.policyViolations && p.policyViolations.length" class="violations">
          Blocked: {{ p.policyViolations.join("; ") }}
        </div>
        <div v-if="p.error" class="violations">Error: {{ p.error }}</div>

        <div v-if="p.txHash" class="meta">
          <a
            :href="explorerTx(p.txHash, store.snapshot?.network ?? 'testnet')"
            target="_blank"
            rel="noopener"
          >
            tx {{ p.txHash.slice(0, 12) }}...
          </a>
        </div>

        <div v-if="p.status === 'pending_approval'" class="actions">
          <button
            class="btn ok"
            :disabled="store.isReadOnly"
            :title="store.isReadOnly ? 'Read-only: switch to Live trading to submit' : ''"
            @click="store.approve(p.id)"
          >
            Approve &amp; submit
          </button>
          <button class="btn danger" @click="store.reject(p.id)">Reject</button>
        </div>

        <div class="meta">
          {{ shortKey(p.id) }} - max slip {{ p.maxSlippageBps }} bps -
          {{ timeStr(p.createdAt) }}
        </div>
      </div>
    </div>
  </section>
</template>
