<script setup lang="ts">
// AI API Key management (Feature 3). Rendered INSIDE AccountSection's Account
// panel — reuses its .acct-* form styling so it looks like a native part of
// that screen. Lets the user bring their own AI provider key: view the
// configured summary (masked, last-4 + updated date), replace it, delete it
// (AUDIT-006-style inline confirm), or — when none is configured — pick a
// provider, paste a key, test it against the provider, and save.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { aiKeyApi, type AiKeyMeta } from "../api";
import { dateTimeStr } from "../format";

const { t, tm } = useI18n();

type Provider = "anthropic" | "openai" | "google" | "deepseek";
const PROVIDERS: Provider[] = ["anthropic", "openai", "google", "deepseek"];

// Deeplinks into the Academy chapter that covers AI API keys (c39), one
// lesson per provider.
const LESSON_BY_PROVIDER: Record<Provider, string> = {
  anthropic: "c39-l2",
  openai: "c39-l3",
  google: "c39-l4",
  deepseek: "c39-l5",
};
function learnMoreLink(p: Provider): string {
  return `/academy/chapter/c39/lesson/${LESSON_BY_PROVIDER[p]}`;
}

// vue-i18n's typed `t()` overloads don't cleanly return arrays; `tm()` is the
// dedicated API for pulling a raw (untranslated-interpolation) message node,
// used here for the guide's numbered steps.
function guideSteps(p: Provider): string[] {
  const raw = tm(`aiKey.guides.${p}.steps`);
  return Array.isArray(raw) ? (raw as string[]) : [];
}

// Provider console URL, rendered both as the plain-text step (via i18n) and
// as a clickable external link right under it.
const PROVIDER_URL: Record<Provider, string> = {
  anthropic: "https://console.anthropic.com",
  openai: "https://platform.openai.com",
  google: "https://aistudio.google.com",
  deepseek: "https://platform.deepseek.com",
};

// --- current state -----------------------------------------------------
const loading = ref(true);
const configured = ref(false);
const meta = ref<AiKeyMeta | null>(null);
// Edit mode is shown when there's no configured key yet, or after "Replace key".
const editing = ref(false);

onMounted(async () => {
  try {
    const m = await aiKeyApi.get();
    meta.value = m;
    configured.value = !!m.configured;
    editing.value = !m.configured;
    if (m.provider) provider.value = m.provider;
    model.value = m.model ?? "";
  } catch {
    // Leave the section in edit mode; the user can still try to save.
    editing.value = true;
  } finally {
    loading.value = false;
  }
});

// --- delete (AUDIT-006 inline confirm pattern, see StopLossPanel.vue) ---
const confirmingDelete = ref(false);
const deleteError = ref("");
async function deleteKey(): Promise<void> {
  deleteError.value = "";
  const r = await aiKeyApi.remove();
  if (r.ok) {
    confirmingDelete.value = false;
    configured.value = false;
    meta.value = null;
    editing.value = true;
    key.value = "";
    testResult.value = null;
  } else {
    deleteError.value = r.data?.error || r.data?.message || t("aiKey.deleteError");
  }
}

function startReplace(): void {
  key.value = "";
  model.value = meta.value?.model ?? "";
  testResult.value = null;
  saveError.value = "";
  saveSuccess.value = false;
  editing.value = true;
}

function cancelEdit(): void {
  editing.value = false;
  key.value = "";
  testResult.value = null;
  saveError.value = "";
  saveSuccess.value = false;
}

// --- edit form -----------------------------------------------------------
const provider = ref<Provider>("anthropic");
const key = ref("");
// 2026-07: the user picks the MODEL too (it's their bill). Empty = the
// provider's default, shown as the placeholder.
const model = ref("");
const showKey = ref(false);
const showGuide = ref(false);

// Catalog defaults per provider, for the placeholder. Mirrors the backend's
// defaultModelFor(); the authoritative value also arrives in GET /api/ai-key.
const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  google: "gemini-2.5-pro",
  deepseek: "deepseek-chat",
};
const modelPlaceholder = computed(() =>
  t("aiKey.modelPlaceholder", {
    model: (meta.value?.provider === provider.value && meta.value?.defaultModel) || DEFAULT_MODEL[provider.value],
  }),
);

const saving = ref(false);
const saveError = ref("");
const saveSuccess = ref(false);

const testing = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

const canAct = computed(() => key.value.trim().length > 0);

async function testConnection(): Promise<void> {
  if (!canAct.value || testing.value) return;
  testing.value = true;
  testResult.value = null;
  try {
    const r = await aiKeyApi.test(provider.value, key.value.trim(), model.value.trim() || undefined);
    if (r.ok) {
      testResult.value = {
        ok: !!r.data?.ok,
        message: r.data?.message || (r.data?.ok ? t("aiKey.saveSuccess") : t("aiKey.testGenericError")),
      };
    } else {
      testResult.value = { ok: false, message: r.data?.error || r.data?.message || t("aiKey.testGenericError") };
    }
  } catch {
    testResult.value = { ok: false, message: t("aiKey.testGenericError") };
  } finally {
    testing.value = false;
  }
}

async function save(): Promise<void> {
  if (!canAct.value || saving.value) return;
  saving.value = true;
  saveError.value = "";
  saveSuccess.value = false;
  try {
    const r = await aiKeyApi.save(provider.value, key.value.trim(), model.value.trim() || undefined);
    if (r.ok) {
      meta.value = r.data;
      configured.value = true;
      editing.value = false;
      key.value = "";
      testResult.value = null;
      saveSuccess.value = true;
    } else {
      saveError.value = r.data?.error || r.data?.message || t("aiKey.saveError");
    }
  } catch {
    saveError.value = t("aiKey.saveError");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="aikey">
    <h3 class="acct-sub">{{ t("aiKey.title") }}</h3>
    <p class="acct-hint">{{ t("aiKey.hint") }}</p>

    <!-- Configured summary -->
    <div v-if="!loading && configured && !editing" class="acct-meta aikey-summary">
      <div class="acct-row">
        <dt>{{ t("aiKey.configuredLabel") }}</dt>
        <dd class="mono">
          {{ t(`aiKey.providers.${meta?.provider ?? "anthropic"}`) }} · &bull;&bull;&bull;&bull;{{ meta?.keyLast4 ?? "----" }}
        </dd>
      </div>
      <div class="acct-row">
        <dt>{{ t("aiKey.modelLabel") }}</dt>
        <dd class="mono">
          {{ meta?.model || meta?.defaultModel || "—" }}
          <span v-if="!meta?.model" class="muted"> ({{ t("aiKey.modelDefaultTag") }})</span>
        </dd>
      </div>
      <div v-if="meta?.updatedAt" class="acct-row">
        <dt></dt>
        <dd class="muted">{{ t("aiKey.keyUpdated", { date: dateTimeStr(meta.updatedAt) }) }}</dd>
      </div>
    </div>

    <p v-if="saveSuccess && !editing" class="acct-success" role="status">{{ t("aiKey.saveSuccess") }}</p>

    <div v-if="!loading && configured && !editing" class="aikey-actions">
      <button class="btn" type="button" @click="startReplace">{{ t("aiKey.replace") }}</button>

      <template v-if="!confirmingDelete">
        <button class="btn aikey-delete" type="button" @click="confirmingDelete = true">
          {{ t("aiKey.delete") }}
        </button>
      </template>
      <span v-else class="aikey-confirm">
        <span class="aikey-confirm-q">{{ t("aiKey.confirmDeleteQ") }}</span>
        <button class="btn danger" type="button" @click="deleteKey">{{ t("aiKey.confirmDeleteYes") }}</button>
        <button class="btn" type="button" @click="confirmingDelete = false">{{ t("aiKey.confirmDeleteNo") }}</button>
      </span>
    </div>
    <p v-if="deleteError" class="violations" role="alert">{{ deleteError }}</p>

    <!-- Edit form: shown when not configured, or after Replace key -->
    <form v-if="!loading && editing" class="acct-form aikey-form" @submit.prevent="save">
      <label class="acct-field">
        <span>{{ t("aiKey.provider") }}</span>
        <select v-model="provider" class="acct-input aikey-select">
          <option v-for="p in PROVIDERS" :key="p" :value="p">{{ t(`aiKey.providers.${p}`) }}</option>
        </select>
      </label>

      <label class="acct-field">
        <span>{{ t("aiKey.keyLabel") }}</span>
        <input
          v-model="key"
          :type="showKey ? 'text' : 'password'"
          class="acct-input"
          autocomplete="off"
          :spellcheck="false"
          :placeholder="t('aiKey.keyPlaceholder')"
        />
      </label>
      <label class="acct-show">
        <input v-model="showKey" type="checkbox" />
        {{ showKey ? t("aiKey.hide") : t("aiKey.show") }}
      </label>

      <!-- 2026-07: per-user model choice. Optional — empty runs the provider's
           default (shown in the placeholder). It's the user's own AI bill, so
           their model choice wins over the operator's configuration. -->
      <label class="acct-field">
        <span>{{ t("aiKey.modelLabel") }}</span>
        <input
          v-model="model"
          type="text"
          class="acct-input"
          autocomplete="off"
          :spellcheck="false"
          :placeholder="modelPlaceholder"
        />
      </label>
      <p class="aikey-model-hint muted">{{ t("aiKey.modelHint") }}</p>

      <button
        class="btn aikey-guide-toggle"
        type="button"
        :aria-expanded="showGuide"
        @click="showGuide = !showGuide"
      >
        {{ t("aiKey.howToGetKey") }} {{ showGuide ? "▾" : "▸" }}
      </button>

      <div v-if="showGuide" class="aikey-guide">
        <p>{{ t(`aiKey.guides.${provider}.intro`) }}</p>
        <ol>
          <li v-for="(step, i) in guideSteps(provider)" :key="i">
            {{ step }}
          </li>
        </ol>
        <a :href="PROVIDER_URL[provider]" target="_blank" rel="noopener" class="aikey-learn">{{ PROVIDER_URL[provider] }}</a>
        <p class="aikey-warning">
          {{ t("aiKey.costWarning", { provider: t(`aiKey.providers.${provider}`) }) }}
        </p>
        <p>{{ t(`aiKey.guides.${provider}.copyPaste`) }}</p>
        <p class="aikey-security">{{ t("aiKey.securityReminder") }}</p>
        <RouterLink :to="learnMoreLink(provider)" class="aikey-learn">
          {{ t("aiKey.learnMoreAcademy") }}
        </RouterLink>
      </div>

      <p v-if="testResult" :class="testResult.ok ? 'acct-success' : 'violations'" :role="testResult.ok ? 'status' : 'alert'">
        {{ testResult.message }}
      </p>
      <p v-if="saveError" class="violations" role="alert">{{ saveError }}</p>

      <div class="aikey-form-actions">
        <button class="btn" type="button" :disabled="!canAct || testing" @click="testConnection">
          {{ testing ? t("aiKey.testing") : t("aiKey.test") }}
        </button>
        <button class="btn primary acct-submit" type="submit" :disabled="!canAct || saving">
          {{ saving ? t("aiKey.saving") : t("aiKey.save") }}
        </button>
        <button v-if="configured" class="btn" type="button" @click="cancelEdit">
          {{ t("aiKey.cancel") }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.aikey {
  margin-top: 4px;
}

/* The .acct-* rules are duplicated from AccountSection.vue ON PURPOSE: its
   styles are scoped, so they never reach this child component's elements -
   without these local copies the select/input rendered as unstyled browser
   defaults (white boxes). Keep in sync with the Change Password form. */
.acct-sub {
  border-top: 1px solid var(--line);
  padding-top: 16px;
  margin: 0 0 12px;
}
.acct-hint {
  color: var(--muted);
  font-size: 13px;
  margin: 0 0 10px;
}
.acct-meta {
  margin: 0 0 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.acct-row {
  display: flex;
  gap: 12px;
  align-items: baseline;
  flex-wrap: wrap;
}
.acct-row dt {
  color: var(--muted);
  font-size: 13px;
  min-width: 140px;
  margin: 0;
}
.acct-row dd {
  margin: 0;
  color: var(--text);
}
.acct-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
}
.acct-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  color: var(--muted);
}
.acct-input {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 10px 12px;
  font-size: 14px;
  min-height: 44px;
  box-sizing: border-box;
  width: 100%;
}
.acct-input:focus {
  outline: none;
  border-color: var(--accent);
}
.acct-show {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  min-height: 44px;
}
.acct-success {
  color: var(--pos);
  font-size: 13px;
  margin: 0;
}
.acct-submit {
  align-self: flex-start;
  min-height: 44px;
}
.aikey-summary {
  margin-bottom: 12px;
}
.aikey-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.aikey-delete {
  min-height: 44px;
}
.aikey-confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.aikey-confirm-q {
  color: var(--warn);
  font-size: 12px;
}
.btn.danger {
  border-color: var(--neg);
  color: var(--neg);
}
.aikey-form {
  max-width: 480px;
}
.aikey-select {
  min-height: 44px;
  cursor: pointer;
}
.aikey-guide-toggle {
  align-self: flex-start;
  min-height: 44px;
  background: transparent;
  border: none;
  color: var(--accent);
  padding: 0;
  text-align: left;
}
.aikey-guide {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--text);
}
.aikey-guide ol {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.aikey-warning {
  border: 1px solid #b58a2e;
  background: rgba(232, 176, 75, 0.12);
  color: #e8b04b;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
}
.aikey-security {
  color: var(--muted);
  font-size: 12px;
  margin: 0;
}
.aikey-model-hint {
  font-size: 12px;
  margin: -6px 0 0;
  line-height: 1.5;
}
.aikey-learn {
  color: var(--accent);
  font-size: 13px;
  text-decoration: none;
  align-self: flex-start;
}
.aikey-learn:hover {
  text-decoration: underline;
}
.aikey-form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
