<script setup lang="ts">
// Wallet setup + management (Feature 3). A logged-in user is routed here by the
// router guard until they have an active wallet; it also doubles as the wallet
// management screen (fund / replace) once configured. Reuses AuthLayout so it
// matches the auth screens' centered-card chrome. No secret is ever stored
// client-side: the one returned by /create is shown once for the user to save.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AuthLayout from "../auth/AuthLayout.vue";
import { walletApi } from "../../api";
import { walletState, loadWalletStatus } from "../../wallet/walletState";

const { t } = useI18n();
const router = useRouter();

type View = "choose" | "create" | "import" | "manage";
const view = ref<View>("choose");

const loading = ref(false);
const error = ref("");
const copied = ref("");

// Create flow: the generated keypair (secret shown ONCE) + the last-4 confirm.
const generated = ref<{ publicKey: string; secret: string } | null>(null);
const last4 = ref("");

// Import / replace inputs.
const importSecret = ref("");
const replaceSecret = ref("");
const replacePassword = ref("");
// AUDIT-007: distinct confirmation for the destructive replace (last 4 of the
// NEW secret, mirroring the create flow's write-it-down check).
const replaceConfirm4 = ref("");
const replacedMsg = ref("");

const SECRET_RE = /^S[A-Z2-7]{55}$/;
const isTestnet = computed(() => walletState.network !== "public");

onMounted(async () => {
  await loadWalletStatus();
  if (walletState.configured) view.value = "manage";
});

async function copy(text: string, tag: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = tag;
    setTimeout(() => (copied.value = ""), 1500);
  } catch {
    /* clipboard blocked - ignore */
  }
}

function reset(): void {
  error.value = "";
  replacedMsg.value = "";
}

async function generate(): Promise<void> {
  reset();
  loading.value = true;
  const r = await walletApi.create();
  loading.value = false;
  if (r.ok && r.data.publicKey && r.data.secret) {
    generated.value = { publicKey: r.data.publicKey, secret: r.data.secret };
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function confirmCreate(): Promise<void> {
  reset();
  loading.value = true;
  const r = await walletApi.confirm(last4.value.trim());
  loading.value = false;
  if (r.ok && r.data.publicKey) {
    generated.value = null;
    last4.value = "";
    await loadWalletStatus(true);
    view.value = "manage";
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function doImport(): Promise<void> {
  reset();
  const s = importSecret.value.trim();
  if (!SECRET_RE.test(s)) {
    error.value = t("walletSetup.importInvalid");
    return;
  }
  loading.value = true;
  const r = await walletApi.import(s);
  loading.value = false;
  if (r.ok && r.data.publicKey) {
    importSecret.value = "";
    await loadWalletStatus(true);
    view.value = "manage";
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function fund(): Promise<void> {
  reset();
  loading.value = true;
  const r = await walletApi.friendbot();
  loading.value = false;
  if (r.ok) {
    await loadWalletStatus(true);
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function doReplace(): Promise<void> {
  reset();
  const s = replaceSecret.value.trim();
  if (!SECRET_RE.test(s)) {
    error.value = t("walletSetup.importInvalid");
    return;
  }
  // AUDIT-007: replacing the wallet cancels every open offer + stop loss and
  // permanently swaps the signing key — require a DISTINCT confirmation step
  // (retyping the new secret's last 4, the same rigor wallet creation uses),
  // not just a warning banner above a submit button.
  if (replaceConfirm4.value.trim() !== s.slice(-4)) {
    error.value = t("walletSetup.replaceConfirmMismatch");
    return;
  }
  loading.value = true;
  const r = await walletApi.replace(s, replacePassword.value);
  loading.value = false;
  if (r.ok && r.data.publicKey) {
    replacedMsg.value = t("walletSetup.replaced", {
      offers: r.data.cancelledOffers ?? 0,
      stops: r.data.cancelledStops ?? 0,
    });
    replaceSecret.value = "";
    replacePassword.value = "";
    replaceConfirm4.value = "";
    await loadWalletStatus(true);
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}
</script>

<template>
  <AuthLayout>
    <!-- 1. Choose: create or import (first-time setup) -->
    <template v-if="view === 'choose'">
      <h1 class="auth-title">{{ t("walletSetup.setupTitle") }}</h1>
      <p class="auth-sub muted">{{ t("walletSetup.setupSubtitle") }}</p>
      <div class="ws-choices">
        <button class="ws-choice" type="button" @click="reset(); view = 'create'">
          <strong>{{ t("walletSetup.createCard") }}</strong>
          <span class="muted">{{ t("walletSetup.createCardDesc") }}</span>
        </button>
        <button class="ws-choice" type="button" @click="reset(); view = 'import'">
          <strong>{{ t("walletSetup.importCard") }}</strong>
          <span class="muted">{{ t("walletSetup.importCardDesc") }}</span>
        </button>
      </div>
    </template>

    <!-- 2. Create: generate, then show secret ONCE + last-4 confirm -->
    <template v-else-if="view === 'create'">
      <h1 class="auth-title">{{ t("walletSetup.createTitle") }}</h1>

      <template v-if="!generated">
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button class="btn primary auth-submit" type="button" :disabled="loading" @click="generate">
          {{ loading ? t("walletSetup.generating") : t("walletSetup.createCard") }}
        </button>
        <div class="auth-links">
          <a href="#" @click.prevent="reset(); view = 'choose'">{{ t("walletSetup.back") }}</a>
        </div>
      </template>

      <template v-else>
        <div class="ws-warn" role="alert">
          <strong>{{ t("walletSetup.secretWarningTitle") }}</strong>
          <p>{{ t("walletSetup.secretWarning") }}</p>
        </div>

        <label class="auth-field">
          <span>{{ t("walletSetup.publicKeyLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key">{{ generated.publicKey }}</code>
            <button class="btn ws-copy" type="button" @click="copy(generated!.publicKey, 'pub')">
              {{ copied === "pub" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <label class="auth-field">
          <span>{{ t("walletSetup.secretKeyLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key ws-secret">{{ generated.secret }}</code>
            <button class="btn ws-copy" type="button" @click="copy(generated!.secret, 'sec')">
              {{ copied === "sec" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <form class="auth-form" @submit.prevent="confirmCreate">
          <label class="auth-field">
            <span>{{ t("walletSetup.confirmPrompt") }}</span>
            <input
              v-model="last4"
              type="text"
              maxlength="4"
              autocomplete="off"
              :placeholder="t('walletSetup.last4Placeholder')"
            />
          </label>
          <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
          <button
            class="btn primary auth-submit"
            type="submit"
            :disabled="loading || last4.trim().length !== 4"
          >
            {{ t("walletSetup.confirmBtn") }}
          </button>
        </form>
      </template>
    </template>

    <!-- 3. Import an existing secret -->
    <template v-else-if="view === 'import'">
      <h1 class="auth-title">{{ t("walletSetup.importTitle") }}</h1>
      <form class="auth-form" @submit.prevent="doImport">
        <label class="auth-field">
          <span>{{ t("walletSetup.secretInputLabel") }}</span>
          <input
            v-model="importSecret"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('walletSetup.secretInputPlaceholder')"
          />
        </label>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button class="btn primary auth-submit" type="submit" :disabled="loading">
          {{ loading ? t("walletSetup.generating") : t("walletSetup.importBtn") }}
        </button>
      </form>
      <div class="auth-links">
        <a href="#" @click.prevent="reset(); view = 'choose'">{{ t("walletSetup.back") }}</a>
      </div>
    </template>

    <!-- 4. Manage: configured wallet (status, funding, replace) -->
    <template v-else>
      <h1 class="auth-title">{{ t("walletSetup.manageTitle") }}</h1>

      <label class="auth-field">
        <span>{{ t("walletSetup.publicKeyLabel") }}</span>
        <div class="ws-keyrow">
          <code class="ws-key">{{ walletState.publicKey }}</code>
          <button class="btn ws-copy" type="button" @click="copy(walletState.publicKey || '', 'pub')">
            {{ copied === "pub" ? t("walletSetup.copied") : t("walletSetup.copy") }}
          </button>
        </div>
      </label>

      <div class="ws-status">
        <span class="muted">{{ t("walletSetup.networkLabel") }}: <strong>{{ walletState.network }}</strong></span>
        <span class="muted">
          {{ t("walletSetup.balanceLabel") }}:
          <strong v-if="walletState.funded">{{ walletState.xlmBalance }} XLM</strong>
          <strong v-else class="neg">{{ t("walletSetup.awaitingFunding") }}</strong>
        </span>
      </div>

      <!-- Funding help when the account isn't on-ledger yet -->
      <template v-if="!walletState.funded">
        <div v-if="isTestnet" class="ws-fund">
          <strong>{{ t("walletSetup.testnetFundTitle") }}</strong>
          <button class="btn primary" type="button" :disabled="loading" @click="fund">
            {{ loading ? t("walletSetup.funding") : t("walletSetup.fundBtn") }}
          </button>
        </div>
        <div v-else class="ws-fund">
          <strong>{{ t("walletSetup.mainnetFundTitle") }}</strong>
          <p class="muted">{{ t("walletSetup.mainnetFundInstructions") }}</p>
        </div>
      </template>

      <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
      <p v-if="replacedMsg" class="ws-ok" role="status">{{ replacedMsg }}</p>

      <button class="btn primary auth-submit" type="button" @click="router.push('/')">
        {{ t("walletSetup.continueBtn") }}
      </button>

      <!-- Replace wallet (password-gated, warns about cancellation) -->
      <details class="ws-replace">
        <summary>{{ t("walletSetup.replaceTitle") }}</summary>
        <div class="ws-warn" role="alert"><p>{{ t("walletSetup.replaceWarning") }}</p></div>
        <form class="auth-form" @submit.prevent="doReplace">
          <label class="auth-field">
            <span>{{ t("walletSetup.secretInputLabel") }}</span>
            <input
              v-model="replaceSecret"
              type="password"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('walletSetup.secretInputPlaceholder')"
            />
          </label>
          <label class="auth-field">
            <span>{{ t("walletSetup.passwordLabel") }}</span>
            <input
              v-model="replacePassword"
              type="password"
              autocomplete="current-password"
              :placeholder="t('walletSetup.passwordPlaceholder')"
            />
          </label>
          <!-- AUDIT-007: distinct confirmation step for a destructive action. -->
          <label class="auth-field">
            <span>{{ t("walletSetup.replaceConfirmLabel") }}</span>
            <input
              v-model="replaceConfirm4"
              type="text"
              autocomplete="off"
              spellcheck="false"
              maxlength="4"
              :placeholder="t('walletSetup.replaceConfirmPlaceholder')"
            />
          </label>
          <button class="btn danger auth-submit" type="submit" :disabled="loading">
            {{ t("walletSetup.replaceBtn") }}
          </button>
        </form>
      </details>
    </template>
  </AuthLayout>
</template>

<style scoped>
.ws-choices {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}
.ws-choice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-2);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s;
}
.ws-choice:hover {
  border-color: var(--accent);
}
.ws-choice strong {
  font-size: 15px;
}
.ws-choice span {
  font-size: 13px;
}
.ws-warn {
  border: 1px solid var(--warn);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 14px 0;
  background: color-mix(in srgb, var(--warn) 10%, transparent);
}
.ws-warn strong {
  color: var(--warn);
}
.ws-warn p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
}
.ws-keyrow {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.ws-key {
  flex: 1;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.ws-secret {
  color: var(--warn);
}
.ws-copy {
  white-space: nowrap;
  flex: 0 0 auto;
}
.ws-status {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 14px 0;
  font-size: 13px;
}
.ws-fund {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}
.ws-ok {
  color: var(--pos);
  font-size: 13px;
}
.ws-replace {
  margin-top: 22px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}
.ws-replace summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
}
</style>
