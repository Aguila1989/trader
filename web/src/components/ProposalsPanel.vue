<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey, timeStr, explorerTx } from "../format";

const { t } = useI18n();
const store = useTraderStore();

// Approve/reject each submit (or cancel) a REAL trade. Track the in-flight id so
// the buttons disable while the call is out (no double-submit), and surface any
// failure inline — a silent failure must never look like nothing happened.
const busyId = ref<string | null>(null);
const actionErrors = reactive<Record<string, string>>({});

async function doApprove(id: string): Promise<void> {
  if (busyId.value) return;
  busyId.value = id;
  delete actionErrors[id];
  try {
    const r = await store.approve(id);
    if (r?.error) actionErrors[id] = r.error;
  } catch (e) {
    actionErrors[id] = (e as Error)?.message || t("proposals.actionFailed");
  } finally {
    busyId.value = null;
  }
}
async function doReject(id: string): Promise<void> {
  if (busyId.value) return;
  busyId.value = id;
  delete actionErrors[id];
  try {
    const r = await store.reject(id);
    if (r?.error) actionErrors[id] = r.error;
  } catch (e) {
    actionErrors[id] = (e as Error)?.message || t("proposals.actionFailed");
  } finally {
    busyId.value = null;
  }
}

// Bug 4A: the Bot-tab proposal feed / approval queue is for AI (and system)
// proposals ONLY. Manual orders execute directly at placement and show up in
// the Manual tab (result line + Active Orders) and the trade history — never
// here for approval or rejection.
const proposals = computed(() => store.proposals.filter((p) => p.initiator !== "manual"));

// AUDIT-041: reuse the history.status.* translations (same pattern as
// HistoryTable); fall back to the underscore-stripped raw code.
function statusText(s: string): string {
  const key = `history.status.${s}`;
  const label = t(key);
  return label === key ? s.replace(/_/g, " ") : label;
}
</script>

<style scoped>
.hl-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.conf {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--line);
}
.reason {
  font-weight: 500;
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
    <h2>{{ t("proposals.title") }}</h2>
    <div class="proposals">
      <p v-if="proposals.length === 0" class="muted">{{ t("proposals.empty") }}</p>

      <div v-for="p in proposals" :key="p.id" class="card">
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
          {{ t("proposals.blocked") }}: {{ p.policyViolations.join("; ") }}
        </div>
        <div v-if="p.error" class="violations">{{ t("proposals.error") }}: {{ p.error }}</div>

        <div v-if="p.txHash" class="meta">
          <a
            :href="explorerTx(p.txHash, store.snapshot?.network ?? 'testnet')"
            target="_blank"
            rel="noopener"
          >
            {{ t("proposals.tx") }} {{ p.txHash.slice(0, 12) }}...
          </a>
        </div>

        <div v-if="p.status === 'pending_approval'" class="actions">
          <button
            class="btn ok"
            :disabled="store.isReadOnly || busyId === p.id"
            :title="store.isReadOnly ? t('proposals.readOnlyHint') : ''"
            @click="doApprove(p.id)"
          >
            {{ busyId === p.id ? t("proposals.actions.approving") : t("proposals.actions.approve") }}
          </button>
          <button class="btn danger" :disabled="busyId === p.id" @click="doReject(p.id)">
            {{ t("proposals.actions.reject") }}
          </button>
        </div>
        <div v-if="actionErrors[p.id]" class="violations" role="alert">
          {{ t("proposals.error") }}: {{ actionErrors[p.id] }}
        </div>

        <div class="meta">
          {{ shortKey(p.id) }} - {{ t("proposals.maxSlip", { n: p.maxSlippageBps }) }} -
          {{ timeStr(p.createdAt) }}
        </div>
      </div>
    </div>
  </section>
</template>
