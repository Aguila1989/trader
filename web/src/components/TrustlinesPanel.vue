<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import AssetSelect from "./AssetSelect.vue";

const { t } = useI18n();
const store = useTraderStore();
const selected = ref("");
const busy = ref(false);

// Tokens you can still add: the curated/whitelisted universe minus XLM and
// minus assets you already have a trustline for. Picking one supplies the
// full CODE:ISSUER, so no manual issuer/home-domain entry is needed.
const addable = computed(() => {
  const have = new Set(store.trustlines.map((t) => t.asset.toUpperCase()));
  return store.universe.filter(
    (t) => t.spec.toUpperCase() !== "XLM" && !have.has(t.spec.toUpperCase()),
  );
});

async function add(): Promise<void> {
  if (busy.value || !selected.value) return;
  busy.value = true;
  try {
    const ok = await store.addTrustline({ asset: selected.value });
    if (ok) selected.value = "";
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
</style>
