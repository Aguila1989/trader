<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { api, feesExportCsvUrl, feesSummaryCsvUrl, UnauthorizedError, type FeesSummary, type FeeRow } from "../api";
import { eur, truncateMiddle, utcStamp, xlm } from "../format";

const props = defineProps<{ network: string }>();
const emit = defineEmits<{ (e: "unauthorized"): void }>();

// ---- yearly summary --------------------------------------------------------
const years = (() => {
  const y = new Date().getUTCFullYear();
  return [y, y - 1, y - 2, y - 3];
})();
const selectedYear = ref(new Date().getUTCFullYear());
const summary = ref<FeesSummary | null>(null);
const summaryError = ref("");

async function loadSummary(): Promise<void> {
  summaryError.value = "";
  try {
    summary.value = await api.feesSummary(selectedYear.value);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    summaryError.value = (err as Error).message;
  }
}

// ---- per-transaction log ----------------------------------------------------
function monthStartIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
function nowIso(): string {
  return new Date().toISOString();
}

const from = ref(monthStartIso().slice(0, 10));
const to = ref(nowIso().slice(0, 10));
const page = ref(0);
const pageSize = 50;
const rows = ref<FeeRow[]>([]);
const total = ref(0);
const rowsError = ref("");
const rowsLoading = ref(false);

async function loadRows(): Promise<void> {
  rowsError.value = "";
  rowsLoading.value = true;
  try {
    const fromIso = new Date(`${from.value}T00:00:00Z`).toISOString();
    const toIso = new Date(`${to.value}T23:59:59Z`).toISOString();
    const res = await api.fees({ from: fromIso, to: toIso, limit: pageSize, offset: page.value * pageSize });
    rows.value = res.rows;
    total.value = res.total;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    rowsError.value = (err as Error).message;
  } finally {
    rowsLoading.value = false;
  }
}

function txUrl(hash: string | null): string | null {
  if (!hash) return null;
  const net = props.network === "public" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

const rangeCsvUrl = computed(() => {
  const fromIso = new Date(`${from.value}T00:00:00Z`).toISOString();
  const toIso = new Date(`${to.value}T23:59:59Z`).toISOString();
  return feesExportCsvUrl(fromIso, toIso);
});
const summaryCsvUrl = computed(() => feesSummaryCsvUrl(selectedYear.value));

const maxPage = computed(() => Math.max(0, Math.ceil(total.value / pageSize) - 1));

function prevPage(): void {
  if (page.value > 0) {
    page.value -= 1;
    void loadRows();
  }
}
function nextPage(): void {
  if (page.value < maxPage.value) {
    page.value += 1;
    void loadRows();
  }
}
function applyRange(): void {
  page.value = 0;
  void loadRows();
}

watch(selectedYear, loadSummary);

onMounted(() => {
  void loadSummary();
  void loadRows();
});
</script>

<template>
  <div class="tab-body">
    <section class="panel">
      <h2>Yearly summary</h2>
      <label class="field" style="max-width: 160px">
        <span>Year</span>
        <select v-model.number="selectedYear" class="inline-select">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>

      <p v-if="summaryError" class="error-text">{{ summaryError }}</p>

      <div v-if="summary" class="table-wrap" style="margin-top: 12px">
        <table class="data">
          <thead>
            <tr>
              <th>Month</th>
              <th class="num">Fees XLM</th>
              <th class="num">Fees EUR (at receipt)</th>
              <th class="num">Tx count</th>
              <th class="num">Avg fee XLM</th>
              <th class="num">Missing-rate rows</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in summary.months" :key="m.month">
              <td>{{ m.month }}</td>
              <td class="num">{{ xlm(m.feeXlm) }}</td>
              <td class="num">{{ eur(m.feeEur) }}</td>
              <td class="num">{{ m.txCount }}</td>
              <td class="num">{{ xlm(m.avgFeeXlm) }}</td>
              <td class="num">{{ m.missingRateCount }}</td>
            </tr>
            <tr>
              <td><strong>Year total</strong></td>
              <td class="num"><strong>{{ xlm(summary.yearTotal.feeXlm) }}</strong></td>
              <td class="num"><strong>{{ eur(summary.yearTotal.feeEur) }}</strong></td>
              <td class="num"><strong>{{ summary.yearTotal.txCount }}</strong></td>
              <td class="num">—</td>
              <td class="num">—</td>
            </tr>
          </tbody>
        </table>
        <p class="hint" style="margin-top: 8px">
          Previous year ({{ summary.previousYearTotal.year }}): {{ xlm(summary.previousYearTotal.feeXlm) }} XLM /
          {{ eur(summary.previousYearTotal.feeEur) }} EUR / {{ summary.previousYearTotal.txCount }} tx
        </p>

        <div class="chip-row" style="margin-top: 10px">
          <span
            v-for="(count, tier) in summary.tierBreakdown"
            :key="tier"
            class="chip"
          >{{ tier }}: {{ count }} paying users</span>
        </div>

        <p style="margin-top: 12px">
          <a :href="summaryCsvUrl">Download yearly summary CSV</a>
        </p>
      </div>
    </section>

    <section class="panel">
      <h2>Transaction log</h2>
      <div class="confirm-row">
        <label class="field" style="max-width: 180px">
          <span>From</span>
          <input v-model="from" type="date" />
        </label>
        <label class="field" style="max-width: 180px">
          <span>To</span>
          <input v-model="to" type="date" />
        </label>
        <button class="btn" style="align-self: flex-end" @click="applyRange">Apply</button>
      </div>

      <p v-if="rowsError" class="error-text">{{ rowsError }}</p>

      <div class="table-wrap" style="margin-top: 12px">
        <table class="data">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Tx hash</th>
              <th>User ID</th>
              <th>Tier</th>
              <th>Type</th>
              <th class="num">Volume XLM</th>
              <th class="num">Fee XLM</th>
              <th class="num">XLM/EUR rate</th>
              <th class="num">EUR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td>{{ utcStamp(r.ts) }}</td>
              <td class="mono">
                <a v-if="txUrl(r.tradeTxHash)" :href="txUrl(r.tradeTxHash)!" target="_blank" rel="noopener">
                  {{ truncateMiddle(r.tradeTxHash) }}
                </a>
                <span v-else>—</span>
              </td>
              <td class="mono">{{ truncateMiddle(r.userId) }}</td>
              <td>{{ r.tier }}</td>
              <td>{{ r.tradeType }}</td>
              <td class="num">{{ xlm(r.tradeVolumeXlm) }}</td>
              <td class="num">{{ xlm(r.feeXlm) }}</td>
              <td class="num">{{ r.xlmEurRate == null ? "—" : r.xlmEurRate }}</td>
              <td class="num">{{ eur(r.feeEur) }}</td>
            </tr>
            <tr v-if="!rowsLoading && rows.length === 0">
              <td colspan="9" class="center muted">No fee transactions in this range.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <span class="hint">{{ total }} total</span>
        <button class="btn small" :disabled="page === 0" @click="prevPage">Prev</button>
        <span class="hint">Page {{ page + 1 }} / {{ maxPage + 1 }}</span>
        <button class="btn small" :disabled="page >= maxPage" @click="nextPage">Next</button>
      </div>

      <p style="margin-top: 10px">
        <a :href="rangeCsvUrl">Download CSV for this range</a>
      </p>

      <p class="foot-note" style="margin-top: 10px">
        EUR values are captured at receipt time and never recalculated.
      </p>
    </section>
  </div>
</template>
