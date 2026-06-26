<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import AssetSelect from "./AssetSelect.vue";
import type { UniverseToken } from "../types";

const { t } = useI18n();
const store = useTraderStore();
const selected = ref("");
const busy = ref(false);

// Feature 6: manual-entry fallback for a token not in the liquidity list.
const manual = ref(false);
const mCode = ref("");
const mDomain = ref("");
const mIssuer = ref("");

// Feature 6: the add dropdown is populated from the LIQUIDITY SCANNER's current
// top tokens, sorted by liquidity (rank 1 = most liquid), each annotated with
// its liquidity rank. Tokens already trusted (or XLM) are excluded. Any
// whitelisted universe token NOT in the scanner list is appended afterwards so
// everything stays addable; a manual-entry fallback covers the rest.
const addable = computed<UniverseToken[]>(() => {
  const have = new Set(store.trustlines.map((t) => t.asset.toUpperCase()));
  const seen = new Set<string>();
  const out: UniverseToken[] = [];

  const recs = [...store.liquidityRecs].sort((a, b) => a.rank - b.rank);
  for (const r of recs) {
    const up = r.asset.toUpperCase();
    if (up === "XLM" || have.has(up) || seen.has(up)) continue;
    seen.add(up);
    const uni = store.universe.find((u) => u.spec.toUpperCase() === up);
    const baseName = uni?.name || r.assetCode;
    out.push({
      spec: r.asset,
      code: r.assetCode,
      issuer: r.assetIssuer || uni?.issuer || null,
      name: `${baseName} · ${t("trustlines.liqRank", { rank: r.rank })}`,
      domain: uni?.domain ?? null,
      tier: uni?.tier ?? null,
    });
  }
  for (const u of store.universe) {
    const up = u.spec.toUpperCase();
    if (up === "XLM" || have.has(up) || seen.has(up)) continue;
    seen.add(up);
    out.push(u);
  }
  return out;
});

const manualValid = computed(
  () => !!mCode.value.trim() && (!!mDomain.value.trim() || !!mIssuer.value.trim()),
);

async function add(): Promise<void> {
  if (busy.value) return;
  if (manual.value ? !manualValid.value : !selected.value) return;
  busy.value = true;
  try {
    const ok = manual.value
      ? await store.addTrustline({
          code: mCode.value.trim(),
          ...(mIssuer.value.trim() ? { issuer: mIssuer.value.trim() } : {}),
          ...(mDomain.value.trim() ? { homeDomain: mDomain.value.trim() } : {}),
        })
      : await store.addTrustline({ asset: selected.value });
    if (ok) {
      selected.value = "";
      mCode.value = "";
      mDomain.value = "";
      mIssuer.value = "";
    }
  } finally {
    busy.value = false;
  }
}

async function remove(asset: string): Promise<void> {
  await store.removeTrustline({ asset });
}
</script>

<template>
  <section class="panel">
    <h2>{{ t("trustlines.title") }}</h2>
    <p class="muted tl-note">
      {{ t("trustlines.intro") }}
      <span v-if="store.isReadOnly">{{ t("trustlines.armToModify") }}</span>
    </p>
    <ul class="levels">
      <li v-if="store.trustlines.length === 0" class="muted-row">
        <span class="muted">{{ t("trustlines.onlyXlm") }}</span>
      </li>
      <li v-for="tl in store.trustlines" :key="tl.asset" class="tl-row">
        <span class="px" :title="tl.asset">{{ tl.code }}</span>
        <span class="amt">{{ fmtNum(tl.balance) }}</span>
        <button
          class="btn tl-remove"
          :disabled="store.isReadOnly || Number(tl.balance) > 0"
          :title="Number(tl.balance) > 0 ? t('trustlines.sellToZeroFirst') : t('trustlines.actions.remove')"
          @click="remove(tl.asset)"
        >
          {{ t("trustlines.actions.remove") }}
        </button>
      </li>
    </ul>
    <div class="tl-form">
      <template v-if="!manual">
        <AssetSelect
          v-model="selected"
          :options="addable"
          :placeholder="t('trustlines.pickToAdd')"
          :aria-label="t('trustlines.assetAriaLabel')"
        />
        <button
          class="btn primary"
          :disabled="busy || store.isReadOnly || !selected"
          @click="add"
        >
          {{ busy ? t("trustlines.actions.adding") : t("trustlines.actions.add") }}
        </button>
      </template>
      <template v-else>
        <input v-model="mCode" class="tl-input" :placeholder="t('trustlines.codePlaceholder')" />
        <input v-model="mDomain" class="tl-input wide" :placeholder="t('trustlines.domainPlaceholder')" />
        <input v-model="mIssuer" class="tl-input wide" :placeholder="t('trustlines.issuerPlaceholder')" />
        <button
          class="btn primary"
          :disabled="busy || store.isReadOnly || !manualValid"
          @click="add"
        >
          {{ busy ? t("trustlines.actions.adding") : t("trustlines.actions.add") }}
        </button>
      </template>
    </div>
    <div class="tl-manual-row">
      <button class="btn tl-toggle" @click="manual = !manual">
        {{ manual ? t("trustlines.useList") : t("trustlines.enterManually") }}
      </button>
      <span v-if="manual" class="muted tl-manual-hint">{{ t("trustlines.manualHint") }}</span>
    </div>
    <p v-if="store.trustlineError" class="violations">{{ store.trustlineError }}</p>
  </section>
</template>

<style scoped>
.tl-note {
  font-size: 12px;
  margin-top: 0;
}
.tl-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tl-remove {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 12px;
}
.tl-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.tl-form .asset-select {
  flex: 1 1 240px;
  min-width: 180px;
}
.tl-input {
  flex: 1 1 140px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-family: ui-monospace, monospace;
}
.tl-input.wide {
  flex: 2 1 220px;
}
.tl-input:focus {
  outline: none;
  border-color: var(--accent);
}
.tl-manual-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.tl-toggle {
  padding: 2px 10px;
  font-size: 12px;
}
.tl-manual-hint {
  font-size: 12px;
}
</style>
