<script setup lang="ts">
// Features 3/4/5 — pending payments (claimable balances): claim, one-click swap
// to XLM (with a value-loss pre-check), swap all, and reject (local hide).
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum, assetCode as code } from "../format";
import type {
  ClaimableBalanceInfo,
  SwapAssessment,
  SwapAllItem,
  SwapAllResult,
} from "../types";

const { t } = useI18n();
const store = useTraderStore();

// Master switch (Feature 2 setting). Hide swap actions when disabled.
const swapEnabled = computed(() => store.snapshot?.settings?.swapAllowToXlm !== false);
const items = computed(() => store.claimables);
const swappable = computed(() => items.value.filter((c) => !c.rejected));

function isNative(c: ClaimableBalanceInfo): boolean {
  return c.asset === "XLM";
}

// --- single swap (with value-loss pre-check) ---
const swap = ref<{
  open: boolean;
  item: ClaimableBalanceInfo | null;
  assessment: SwapAssessment | null;
  loading: boolean;
  busy: boolean;
}>({ open: false, item: null, assessment: null, loading: false, busy: false });

async function openSwap(c: ClaimableBalanceInfo): Promise<void> {
  swap.value = { open: true, item: c, assessment: null, loading: true, busy: false };
  const a = await store.claimableSwapQuote(c.id);
  // Modal may have been closed while the quote was in flight.
  if (swap.value.open && swap.value.item?.id === c.id) {
    swap.value.assessment = a;
    swap.value.loading = false;
  }
}
function closeSwap(): void {
  swap.value = { open: false, item: null, assessment: null, loading: false, busy: false };
}
const swapLoss = computed(() => {
  const a = swap.value.assessment;
  return a != null && a.valueLossPct != null && a.withinThreshold === false;
});
async function confirmSwap(): Promise<void> {
  const it = swap.value.item;
  if (!it || swap.value.busy) return;
  swap.value.busy = true;
  // Force only when the user is knowingly accepting a value loss.
  const ok = await store.swapClaimable(it.id, swapLoss.value);
  swap.value.busy = false;
  if (ok) closeSwap();
}

// --- reject ---
const reject = ref<{ open: boolean; item: ClaimableBalanceInfo | null; reason: string; busy: boolean }>(
  { open: false, item: null, reason: "", busy: false },
);
function openReject(c: ClaimableBalanceInfo): void {
  reject.value = { open: true, item: c, reason: "", busy: false };
}
function closeReject(): void {
  reject.value = { open: false, item: null, reason: "", busy: false };
}
async function confirmReject(): Promise<void> {
  const it = reject.value.item;
  if (!it || reject.value.busy) return;
  reject.value.busy = true;
  const ok = await store.rejectClaimable(it.id, reject.value.reason.trim() || "user-initiated");
  reject.value.busy = false;
  if (ok) closeReject();
}

// --- swap all ---
const swapAll = ref<{
  open: boolean;
  loading: boolean;
  busy: boolean;
  rows: SwapAllItem[];
  threshold: number;
  includeLosing: boolean;
  result: SwapAllResult | null;
}>({ open: false, loading: false, busy: false, rows: [], threshold: 0, includeLosing: false, result: null });

async function openSwapAll(): Promise<void> {
  swapAll.value = { open: true, loading: true, busy: false, rows: [], threshold: 0, includeLosing: false, result: null };
  const q = await store.swapAllQuote();
  if (swapAll.value.open) {
    swapAll.value.rows = q?.items ?? [];
    swapAll.value.threshold = q?.threshold ?? 0;
    swapAll.value.loading = false;
  }
}
function closeSwapAll(): void {
  swapAll.value = { open: false, loading: false, busy: false, rows: [], threshold: 0, includeLosing: false, result: null };
}
const totalEstXlm = computed(() =>
  swapAll.value.rows.reduce((s, r) => s + (r.estXlm != null ? Number(r.estXlm) : 0), 0),
);
async function confirmSwapAll(): Promise<void> {
  if (swapAll.value.busy) return;
  swapAll.value.busy = true;
  const r = await store.swapAll(swapAll.value.includeLosing);
  swapAll.value.busy = false;
  if (r) swapAll.value.result = r; // keep modal open to show the summary
}

function toggleRejected(ev: Event): void {
  void store.setShowRejectedClaimables((ev.target as HTMLInputElement).checked);
}
</script>

<template>
  <div class="pp">
    <div class="pp-head">
      <h3>{{ t("pending.title") }}</h3>
      <button
        v-if="swapEnabled && swappable.length > 0"
        class="btn pp-all"
        :disabled="store.isReadOnly"
        @click="openSwapAll"
      >
        {{ t("pending.swapAll") }}
      </button>
    </div>

    <ul class="levels">
      <li v-if="items.length === 0" class="muted-row">
        <span class="muted">{{ t("pending.none") }}</span>
      </li>
      <li v-for="c in items" :key="c.id" class="pp-row" :class="{ rejected: c.rejected }">
        <span class="px">
          {{ fmtNum(c.amount) }} {{ code(c.asset) }}
          <span v-if="c.rejected" class="pp-badge">{{ t("pending.rejectedBadge") }}</span>
          <span v-if="c.rejected && c.rejectedReason" class="muted pp-reason">— {{ c.rejectedReason }}</span>
        </span>
        <div class="pp-actions">
          <template v-if="c.rejected">
            <button class="btn pp-btn" @click="store.unrejectClaimable(c.id)">
              {{ t("pending.unreject") }}
            </button>
          </template>
          <template v-else>
            <button class="btn pp-btn" :disabled="store.isReadOnly" @click="store.claim(c.id)">
              {{ t("pending.claim") }}
            </button>
            <button
              v-if="swapEnabled && !isNative(c)"
              class="btn pp-btn primary"
              :disabled="store.isReadOnly"
              @click="openSwap(c)"
            >
              {{ t("pending.swapToXlm") }}
            </button>
            <button class="btn pp-btn danger" @click="openReject(c)">
              {{ t("pending.reject") }}
            </button>
          </template>
        </div>
      </li>
    </ul>

    <label class="pp-showrejected">
      <input type="checkbox" :checked="store.showRejectedClaimables" @change="toggleRejected" />
      {{ t("pending.showRejected") }}
    </label>

    <!-- ===== single-swap pre-check modal ===== -->
    <div v-if="swap.open" class="pp-modal-back" @click.self="closeSwap">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <h4>{{ t("pending.swapToXlm") }}</h4>
        <p v-if="swap.loading" class="muted">{{ t("pending.checking") }}</p>
        <template v-else-if="swap.assessment">
          <!-- value-loss warning -->
          <p v-if="swapLoss" class="pp-warn">
            ⚠
            {{ t("pending.lossWarn", {
              amt: fmtNum(swap.assessment.amount),
              token: code(swap.assessment.asset),
              xlm: fmtNum(swap.assessment.estXlm ?? "0"),
              usdc: fmtNum(swap.assessment.tokenUsdc ?? "0"),
              loss: swap.assessment.valueLossPct ?? 0,
            }) }}
          </p>
          <!-- favorable / unknown -->
          <p v-else class="pp-ok">
            {{ t("pending.okInfo", {
              amt: fmtNum(swap.assessment.amount),
              token: code(swap.assessment.asset),
              xlm: fmtNum(swap.assessment.estXlm ?? "0"),
            }) }}
            <span v-if="swap.assessment.valueLossPct == null" class="muted"> {{ t("pending.unpriced") }}</span>
          </p>
        </template>
        <p v-else class="pp-warn">{{ t("pending.quoteFailed") }}</p>

        <div class="pp-modal-actions">
          <button class="btn" :disabled="swap.busy" @click="closeSwap">
            {{ swapLoss ? t("pending.keepToken", { token: code(swap.item?.asset ?? "") }) : t("pending.cancel") }}
          </button>
          <button
            class="btn primary"
            :disabled="swap.busy || swap.loading || !swap.assessment"
            @click="confirmSwap"
          >
            {{ swap.busy ? t("pending.swapping") : t("pending.swapToXlm") }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== reject modal ===== -->
    <div v-if="reject.open" class="pp-modal-back" @click.self="closeReject">
      <div class="pp-modal" role="dialog" aria-modal="true">
        <h4>{{ t("pending.reject") }}</h4>
        <p>{{ t("pending.rejectConfirm") }}</p>
        <input
          v-model="reject.reason"
          class="pp-input"
          :placeholder="t('pending.reasonPlaceholder')"
        />
        <div class="pp-modal-actions">
          <button class="btn" :disabled="reject.busy" @click="closeReject">{{ t("pending.cancel") }}</button>
          <button class="btn danger" :disabled="reject.busy" @click="confirmReject">
            {{ reject.busy ? t("pending.rejecting") : t("pending.reject") }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== swap-all modal ===== -->
    <div v-if="swapAll.open" class="pp-modal-back" @click.self="closeSwapAll">
      <div class="pp-modal wide" role="dialog" aria-modal="true">
        <h4>{{ t("pending.swapAll") }}</h4>

        <p v-if="swapAll.loading" class="muted">{{ t("pending.checking") }}</p>

        <!-- result summary -->
        <template v-else-if="swapAll.result">
          <p class="pp-ok">
            {{ t("pending.allDone", {
              ok: swapAll.result.swapped.length,
              skip: swapAll.result.skipped.length,
              fail: swapAll.result.failed.length,
            }) }}
          </p>
          <ul v-if="swapAll.result.failed.length" class="pp-fail-list">
            <li v-for="f in swapAll.result.failed" :key="f.id" class="muted">
              {{ code(f.asset) }}: {{ f.error }}
            </li>
          </ul>
          <div class="pp-modal-actions">
            <button class="btn primary" @click="closeSwapAll">{{ t("pending.close") }}</button>
          </div>
        </template>

        <!-- pre-swap summary table -->
        <template v-else>
          <table class="pp-table">
            <thead>
              <tr>
                <th>{{ t("pending.colToken") }}</th>
                <th class="num">{{ t("pending.colAmount") }}</th>
                <th class="num">{{ t("pending.colEstXlm") }}</th>
                <th class="num">{{ t("pending.colUsdc") }}</th>
                <th class="num">{{ t("pending.colLoss") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in swapAll.rows" :key="r.id" :class="{ losing: !r.withinThreshold }">
                <td>{{ code(r.asset) }}</td>
                <td class="num">{{ fmtNum(r.amount) }}</td>
                <td class="num">{{ r.estXlm != null ? fmtNum(r.estXlm) : "—" }}</td>
                <td class="num">{{ r.xlmUsdc != null ? fmtNum(r.xlmUsdc) : "—" }}</td>
                <td class="num">{{ r.valueLossPct != null ? r.valueLossPct + "%" : "—" }}</td>
              </tr>
              <tr v-if="swapAll.rows.length === 0">
                <td colspan="5" class="muted center">{{ t("pending.none") }}</td>
              </tr>
            </tbody>
            <tfoot v-if="swapAll.rows.length">
              <tr>
                <td colspan="2">{{ t("pending.total") }}</td>
                <td class="num">≈ {{ fmtNum(totalEstXlm) }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>

          <label class="pp-include">
            <input type="checkbox" v-model="swapAll.includeLosing" />
            {{ t("pending.includeLosing") }}
          </label>

          <div class="pp-modal-actions">
            <button class="btn" :disabled="swapAll.busy" @click="closeSwapAll">{{ t("pending.cancel") }}</button>
            <button
              class="btn primary"
              :disabled="swapAll.busy || store.isReadOnly || swapAll.rows.length === 0"
              @click="confirmSwapAll"
            >
              {{ swapAll.busy ? t("pending.swapping") : t("pending.confirmSwapAll") }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pp-head h3 {
  margin: 0;
}
.pp-all {
  padding: 3px 12px;
  font-size: 12px;
}
.pp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pp-row.rejected {
  opacity: 0.6;
}
.pp-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pp-btn {
  padding: 2px 10px;
  font-size: 12px;
}
.pp-badge {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--warn);
  border: 1px solid #5e4a1f;
  border-radius: 6px;
  padding: 1px 5px;
  margin-left: 6px;
}
.pp-reason {
  font-size: 12px;
}
.pp-showrejected {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 8px;
  cursor: pointer;
}
.btn.danger {
  border-color: #5e2326;
  color: var(--neg);
}
/* modal */
.pp-modal-back {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
}
.pp-modal {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px;
  max-width: 460px;
  width: 100%;
}
.pp-modal.wide {
  max-width: 640px;
}
.pp-modal h4 {
  margin: 0 0 10px;
}
.pp-warn {
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid #5e4a1f;
  color: var(--warn);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
}
.pp-ok {
  font-size: 13px;
}
.pp-input {
  width: 100%;
  box-sizing: border-box;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  margin-top: 8px;
}
.pp-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
.pp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.pp-table th,
.pp-table td {
  padding: 5px 8px;
  border-bottom: 1px solid var(--line);
  text-align: left;
}
.pp-table .num {
  text-align: right;
  font-family: ui-monospace, monospace;
}
.pp-table tr.losing td {
  color: var(--warn);
}
.pp-fail-list {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 12px;
}
.pp-include {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 10px;
  cursor: pointer;
}
.center {
  text-align: center;
}
</style>
