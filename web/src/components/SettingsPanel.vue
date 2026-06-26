<script setup lang="ts">
// Feature 2 — every operational parameter, editable live (no file edits, no
// restart). The catalog (labels/bounds/defaults) comes from GET /api/settings;
// the CURRENT value of each rides the SSE snapshot, so a change made here (or
// elsewhere) updates immediately. The backend clamps every value, so this is a
// convenience layer over server validation. Grouped per the spec: AI Trading /
// Risk & Safety / Automation / Swap & Transfer.
//
// NOTE: the AI confidence threshold and the drawdown pause are NOT here — they
// are per-factor risk knobs owned by the Risk Settings panel (Expert Mode), the
// single source of truth for them. A note below points there to avoid a second,
// conflicting source.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import InfoTip from "./InfoTip.vue";
import type { SettingMeta } from "../types";

const store = useTraderStore();
const { t } = useI18n();

type Group = SettingMeta["group"];
const GROUPS: Group[] = ["ai", "risk", "automation", "swap"];

function inGroup(g: Group): SettingMeta[] {
  return store.settings.filter((s) => s.group === g);
}

const modified = (s: SettingMeta): boolean => s.value !== s.default;

function onNumber(s: SettingMeta, ev: Event): void {
  const n = Number((ev.target as HTMLInputElement).value);
  if (!Number.isFinite(n)) return;
  void store.setSetting(s.key, n);
}
function onBool(s: SettingMeta, ev: Event): void {
  void store.setSetting(s.key, (ev.target as HTMLInputElement).checked);
}
function reset(s: SettingMeta): void {
  void store.resetSetting(s.key);
}

// Load the catalog once if the panel mounts before init() finished.
const loaded = computed(() => store.settings.length > 0);
if (!loaded.value) void store.loadSettings();
</script>

<template>
  <section class="panel sp">
    <div class="sp-head">
      <h2>{{ t("settingsPanel.title") }}</h2>
    </div>
    <p class="muted sp-note">{{ t("settingsPanel.note") }}</p>
    <p class="muted sp-note sp-risknote">↳ {{ t("settingsPanel.riskNote") }}</p>

    <p v-if="store.settingsError" class="sp-error">⚠ {{ store.settingsError }}</p>

    <div v-for="g in GROUPS" :key="g" class="sp-group">
      <h3 class="sp-group-title">{{ t("settingsPanel.groups." + g) }}</h3>
      <ul class="sp-list">
        <li v-for="s in inGroup(g)" :key="s.key" class="sp-row">
          <span class="sp-label">
            {{ s.label }}<InfoTip :text="s.description" :label="s.label" />
          </span>

          <!-- boolean -->
          <label v-if="s.type === 'boolean'" class="sp-bool">
            <input
              type="checkbox"
              :checked="s.value === true"
              @change="onBool(s, $event)"
            />
            <span class="sp-bool-text">
              {{ s.value ? t("settingsPanel.on") : t("settingsPanel.off") }}
            </span>
          </label>

          <!-- number -->
          <span v-else class="sp-num">
            <input
              type="number"
              class="sp-input"
              :min="s.min"
              :max="s.max"
              :step="s.step"
              :value="s.value"
              @change="onNumber(s, $event)"
            />
            <span v-if="s.unit" class="sp-unit">{{ s.unit }}</span>
          </span>

          <button
            class="btn sp-reset"
            :disabled="!modified(s)"
            :title="t('settingsPanel.resetTo', { v: String(s.default) })"
            @click="reset(s)"
          >
            {{ t("settingsPanel.reset") }}
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.sp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sp-head h2 {
  margin: 0;
}
.sp-note {
  font-size: 12px;
  margin: 6px 0 0;
}
.sp-risknote {
  margin-top: 2px;
  color: var(--accent);
}
.sp-error {
  background: rgba(229, 72, 77, 0.12);
  border: 1px solid #5e2326;
  color: var(--neg);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  margin: 10px 0 0;
}
.sp-group {
  margin-top: 16px;
}
.sp-group-title {
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 8px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 6px;
}
.sp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.sp-label {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  min-width: 240px;
  flex: 1 1 240px;
}
.sp-num,
.sp-bool {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sp-bool {
  cursor: pointer;
  font-size: 12px;
  color: var(--muted);
}
.sp-input {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 6px 10px;
  font-family: ui-monospace, monospace;
  max-width: 130px;
}
.sp-input:focus {
  outline: none;
  border-color: var(--accent);
}
.sp-unit {
  font-size: 12px;
  color: var(--muted);
  min-width: 44px;
}
.sp-reset {
  padding: 4px 12px;
  font-size: 12px;
}
.sp-reset:disabled {
  opacity: 0.35;
}
</style>
