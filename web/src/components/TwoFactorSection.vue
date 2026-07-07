<script setup lang="ts">
// End-user 2FA (TOTP), OPT-IN. Rendered INSIDE AccountSection's Account panel —
// reuses its .acct-* form styling (duplicated locally since those styles are
// scoped, same pattern as AiKeySection.vue).
//
// Flow: "Set up 2FA" -> the server generates a secret (not yet enabled) and
// returns it + an otpauth:// URI, rendered as a QR code (vendored generator,
// see web/src/lib/qr.ts — safe to pass an otpauth URI, same as the wallet
// Receive address) -> the user scans it and enters a 6-digit code to confirm
// -> only THEN does the server flip totpEnabled on and login starts asking for
// a code. Disabling requires BOTH the current password AND a valid code.
//
// There are no backup codes: losing the authenticator with 2FA enabled means
// contacting an admin to reset it (src/admin/routes.ts reset-2fa) before the
// account can be logged into again.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { authApi } from "../api";
import { makeQr } from "../lib/qr";

const { t } = useI18n();

// --- current state ---------------------------------------------------------
const loading = ref(true);
const enabled = ref(false);

onMounted(async () => {
  try {
    const r = await authApi.account();
    if (r.ok) enabled.value = !!r.data.user?.totpEnabled;
  } finally {
    loading.value = false;
  }
});

// --- setup (generate secret + QR) ------------------------------------------
const settingUp = ref(false);
const setupError = ref("");
const secret = ref("");
const otpauthUri = ref("");

const qr = computed(() => {
  if (!otpauthUri.value) return null;
  try {
    return makeQr(otpauthUri.value, "M");
  } catch {
    return null;
  }
});
const qrPath = computed(() => {
  const q = qr.value;
  if (!q) return "";
  const QUIET = 4;
  let d = "";
  for (let y = 0; y < q.size; y++) {
    for (let x = 0; x < q.size; x++) {
      if (q.modules[y][x]) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
    }
  }
  return d;
});
const qrDim = computed(() => (qr.value ? qr.value.size + 8 : 0));

async function startSetup(): Promise<void> {
  setupError.value = "";
  enableError.value = "";
  enableSuccess.value = false;
  confirmCode.value = "";
  const r = await authApi.setup2fa();
  if (r.ok && r.data.secret && r.data.otpauthUri) {
    secret.value = r.data.secret;
    otpauthUri.value = r.data.otpauthUri;
    settingUp.value = true;
  } else {
    setupError.value = r.data?.error || r.data?.message || t("twoFa.account.setupError");
  }
}

function cancelSetup(): void {
  settingUp.value = false;
  secret.value = "";
  otpauthUri.value = "";
  confirmCode.value = "";
  enableError.value = "";
}

// --- confirm + enable --------------------------------------------------------
const confirmCode = ref("");
const enabling = ref(false);
const enableError = ref("");
const enableSuccess = ref(false);

async function confirmEnable(): Promise<void> {
  if (confirmCode.value.trim().length !== 6 || enabling.value) return;
  enabling.value = true;
  enableError.value = "";
  try {
    const r = await authApi.enable2fa(confirmCode.value.trim());
    if (r.ok) {
      enabled.value = true;
      settingUp.value = false;
      secret.value = "";
      otpauthUri.value = "";
      confirmCode.value = "";
      enableSuccess.value = true;
    } else {
      enableError.value = r.data?.error || r.data?.message || t("twoFa.account.enableError");
    }
  } finally {
    enabling.value = false;
  }
}

// --- disable (password + code) ----------------------------------------------
const disabling = ref(false);
const disablePassword = ref("");
const disableCode = ref("");
const disableError = ref("");
const showDisableForm = ref(false);

const canDisable = computed(
  () => disablePassword.value.length > 0 && disableCode.value.trim().length === 6 && !disabling.value,
);

async function disable(): Promise<void> {
  if (!canDisable.value) return;
  disabling.value = true;
  disableError.value = "";
  try {
    const r = await authApi.disable2fa(disablePassword.value, disableCode.value.trim());
    if (r.ok) {
      enabled.value = false;
      showDisableForm.value = false;
      disablePassword.value = "";
      disableCode.value = "";
      enableSuccess.value = false;
    } else {
      disableError.value = r.data?.error || r.data?.message || t("twoFa.account.disableError");
    }
  } finally {
    disabling.value = false;
  }
}

function cancelDisable(): void {
  showDisableForm.value = false;
  disablePassword.value = "";
  disableCode.value = "";
  disableError.value = "";
}
</script>

<template>
  <div class="twofa">
    <h3 class="acct-sub">{{ t("twoFa.title") }}</h3>
    <p class="acct-hint">{{ t("twoFa.hint") }}</p>

    <div v-if="!loading" class="acct-meta">
      <div class="acct-row">
        <dt>{{ t("twoFa.statusLabel") }}</dt>
        <dd>
          <strong :class="enabled ? 'pos' : ''">
            {{ enabled ? t("twoFa.statusOn") : t("twoFa.statusOff") }}
          </strong>
        </dd>
      </div>
    </div>

    <p v-if="enableSuccess && enabled" class="acct-success" role="status">{{ t("twoFa.account.enableSuccess") }}</p>

    <!-- Enabled, not editing: offer to turn it off -->
    <template v-if="!loading && enabled && !showDisableForm">
      <button class="btn twofa-action" type="button" @click="showDisableForm = true">
        {{ t("twoFa.disable") }}
      </button>
    </template>

    <!-- Disable form: password + code -->
    <form v-if="showDisableForm" class="acct-form twofa-form" @submit.prevent="disable">
      <p class="twofa-warning">{{ t("twoFa.account.disableWarning") }}</p>
      <label class="acct-field">
        <span>{{ t("twoFa.account.currentPassword") }}</span>
        <input v-model="disablePassword" type="password" class="acct-input" autocomplete="current-password" />
      </label>
      <label class="acct-field">
        <span>{{ t("twoFa.account.codeLabel") }}</span>
        <input
          v-model="disableCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          pattern="[0-9]*"
          class="acct-input"
        />
      </label>
      <p v-if="disableError" class="violations" role="alert">{{ disableError }}</p>
      <div class="twofa-form-actions">
        <button class="btn danger" type="submit" :disabled="!canDisable">
          {{ disabling ? t("twoFa.account.disabling") : t("twoFa.disable") }}
        </button>
        <button class="btn" type="button" @click="cancelDisable">{{ t("twoFa.cancel") }}</button>
      </div>
    </form>

    <!-- Not enabled, not mid-setup: offer to start -->
    <template v-if="!loading && !enabled && !settingUp">
      <p v-if="setupError" class="violations" role="alert">{{ setupError }}</p>
      <button class="btn primary twofa-action" type="button" @click="startSetup">
        {{ t("twoFa.setup") }}
      </button>
    </template>

    <!-- Mid-setup: show secret + QR + confirm code -->
    <div v-if="settingUp" class="twofa-setup">
      <p class="acct-hint">{{ t("twoFa.account.scanHint") }}</p>

      <svg
        v-if="qr"
        class="twofa-qr"
        :viewBox="`0 0 ${qrDim} ${qrDim}`"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        shape-rendering="crispEdges"
        :aria-label="t('twoFa.account.qrAlt')"
      >
        <rect :width="qrDim" :height="qrDim" fill="#ffffff" />
        <path :d="qrPath" fill="#000000" />
      </svg>

      <div class="acct-row twofa-secret-row">
        <dt>{{ t("twoFa.account.manualEntry") }}</dt>
        <dd class="mono">{{ secret }}</dd>
      </div>

      <form class="acct-form" @submit.prevent="confirmEnable">
        <label class="acct-field">
          <span>{{ t("twoFa.account.codeLabel") }}</span>
          <input
            v-model="confirmCode"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern="[0-9]*"
            class="acct-input"
            autofocus
          />
        </label>
        <p v-if="enableError" class="violations" role="alert">{{ enableError }}</p>
        <div class="twofa-form-actions">
          <button class="btn primary acct-submit" type="submit" :disabled="confirmCode.trim().length !== 6 || enabling">
            {{ enabling ? t("twoFa.account.enabling") : t("twoFa.account.confirmEnable") }}
          </button>
          <button class="btn" type="button" @click="cancelSetup">{{ t("twoFa.cancel") }}</button>
        </div>
      </form>

      <p class="twofa-warning">{{ t("twoFa.account.noBackupWarning") }}</p>
    </div>
  </div>
</template>

<style scoped>
/* The .acct-* rules are duplicated from AccountSection.vue ON PURPOSE: its
   styles are scoped, so they never reach this child component's elements -
   without these local copies the input/button would render as unstyled
   browser defaults. Keep in sync with AiKeySection.vue / the Change Password
   form. */
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
  margin: 0 0 12px;
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
.acct-success {
  color: var(--pos);
  font-size: 13px;
  margin: 0;
}
.acct-submit {
  align-self: flex-start;
  min-height: 44px;
}
.twofa {
  margin-top: 4px;
}
.twofa-action {
  min-height: 44px;
  margin-bottom: 12px;
}
.btn.danger {
  border-color: var(--neg);
  color: var(--neg);
}
.twofa-form {
  max-width: 420px;
  margin-bottom: 12px;
}
.twofa-form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.twofa-setup {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}
.twofa-qr {
  display: block;
  width: 100%;
  height: auto;
  max-width: 220px;
  border-radius: 10px;
  background: #ffffff;
  padding: 8px;
  box-sizing: border-box;
}
.twofa-secret-row dd {
  word-break: break-all;
}
.twofa-warning {
  border: 1px solid #b58a2e;
  background: rgba(232, 176, 75, 0.12);
  color: #e8b04b;
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
  max-width: 420px;
}
</style>
