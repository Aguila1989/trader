<script setup lang="ts">
// Account section of the Settings panel: read-only identity (email + account
// creation date) and the change-password form. Reuses the same password policy
// + strength meter as registration. The server is authoritative: it verifies the
// current password (generic error on mismatch), enforces the policy, revokes all
// OTHER sessions, keeps this one alive, and audit-logs the change.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { authApi, billingApi } from "../api";
import { session } from "../auth/session";
import { checkPassword } from "../auth/passwordPolicy";
import { dateTimeStr } from "../format";
import { closeSettings } from "../ui/uiState";
import { startTour } from "../onboarding/tour";
import { billingState, loadBillingStatus } from "../billing/premium";
import AiKeySection from "./AiKeySection.vue";
import TwoFactorSection from "./TwoFactorSection.vue";
import PasswordStrengthMeter from "./auth/PasswordStrengthMeter.vue";

const { t } = useI18n();
const router = useRouter();

// --- read-only identity ---
const email = ref(session.user?.email ?? "");
const createdAt = ref<string | null>(null);
onMounted(async () => {
  void loadBillingStatus(true); // Feature 2: fresh subscription status
  const r = await authApi.account();
  if (r.ok && r.data.user) {
    email.value = r.data.user.email;
    createdAt.value = r.data.user.createdAt;
  }
});

// Feature 2: pricing lives on its own page; the settings modal swallows
// navigation while open, so close it before routing there.
function goPricing(): void {
  closeSettings();
  void router.push("/pricing").catch(() => {});
}

// Self-service cancellation/management via the Stripe Billing Portal (Part 1).
const openingPortal = ref(false);
const portalError = ref("");
async function openPortal(): Promise<void> {
  portalError.value = "";
  openingPortal.value = true;
  try {
    const r = await billingApi.portal();
    if (r.ok && r.data?.url) {
      window.location.href = r.data.url;
    } else {
      portalError.value = r.data?.error || r.data?.message || t("billing.account.portalError");
    }
  } catch {
    portalError.value = t("billing.account.portalError");
  } finally {
    openingPortal.value = false;
  }
}

// --- restart the onboarding tutorial (Feature 1) ---
const restartError = ref("");
const restarting = ref(false);
async function restartTutorial(): Promise<void> {
  restartError.value = "";
  restarting.value = true;
  // Reset the server flag first so the tour also auto-starts on the next load
  // if the user closes the app mid-way through.
  const r = await authApi.setOnboarding(false);
  restarting.value = false;
  if (!r.ok) {
    restartError.value = t("onboarding.account.error");
    return;
  }
  // The settings modal swallows navigations while open — close it first.
  closeSettings();
  void router.push("/").catch(() => {});
  startTour();
}

// --- change password ---
const current = ref("");
const next = ref("");
const confirm = ref("");
const showPw = ref(false);
const submitting = ref(false);
const error = ref("");
const success = ref(false);

const policyOk = computed(() => checkPassword(next.value).valid);
const matches = computed(() => next.value.length > 0 && next.value === confirm.value);
const distinct = computed(() => next.value !== current.value);
const canSubmit = computed(
  () => current.value.length > 0 && policyOk.value && matches.value && distinct.value && !submitting.value,
);

async function submit(): Promise<void> {
  error.value = "";
  success.value = false;
  if (!matches.value) {
    error.value = t("account.mismatch");
    return;
  }
  if (!distinct.value) {
    error.value = t("account.sameAsCurrent");
    return;
  }
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const r = await authApi.changePassword(current.value, next.value);
    if (r.ok) {
      success.value = true;
      current.value = "";
      next.value = "";
      confirm.value = "";
    } else {
      // Server returns a generic message for a wrong current password.
      error.value = r.data?.error || r.data?.message || t("account.genericError");
    }
  } catch {
    error.value = t("account.genericError");
  } finally {
    submitting.value = false;
  }
}

// --- GDPR: data export ---
const exporting = ref(false);
const exportError = ref("");
async function downloadMyData(): Promise<void> {
  exportError.value = "";
  exporting.value = true;
  try {
    await authApi.exportData();
  } catch {
    exportError.value = t("account.gdpr.exportError");
  } finally {
    exporting.value = false;
  }
}

// --- GDPR: account deletion ---
// Gated behind BOTH a typed confirmation phrase (DELETE) AND the current
// password - mirrors the change-password/2FA-disable convention of never
// trusting a single factor for an irreversible action. The wallet warning is
// deliberately shown unconditionally (a wallet may hold funds even if the UI
// doesn't currently know its balance), matching the server-side comment in
// src/auth/store.ts deleteUserAndData.
const deleteConfirmText = ref("");
const deletePassword = ref("");
const deleting = ref(false);
const deleteError = ref("");
const CONFIRM_PHRASE = "DELETE";
const canDelete = computed(
  () => deleteConfirmText.value.trim() === CONFIRM_PHRASE && deletePassword.value.length > 0 && !deleting.value,
);

async function deleteAccount(): Promise<void> {
  deleteError.value = "";
  if (!canDelete.value) return;
  deleting.value = true;
  try {
    const r = await authApi.deleteAccount(deletePassword.value);
    if (!r.ok) {
      deleteError.value = r.data?.error || r.data?.message || t("account.gdpr.deleteGenericError");
      deleting.value = false;
      return;
    }
    // The server already cleared the session cookies. Hard-reload to /login so
    // every in-memory store/SSE/poll timer resets cleanly (same pattern as the
    // Sidebar logout action), rather than trying to unwind app state in place.
    window.location.href = "/login";
  } catch {
    deleteError.value = t("account.gdpr.deleteGenericError");
    deleting.value = false;
  }
}
</script>

<template>
  <section class="panel acct">
    <h2>{{ t("account.title") }}</h2>

    <dl class="acct-meta">
      <div class="acct-row">
        <dt>{{ t("account.email") }}</dt>
        <dd class="mono">{{ email }}</dd>
      </div>
      <div v-if="createdAt" class="acct-row">
        <dt>{{ t("account.created") }}</dt>
        <dd>{{ dateTimeStr(createdAt) }}</dd>
      </div>
    </dl>

    <h3 class="acct-sub">{{ t("billing.account.title") }}</h3>
    <dl class="acct-meta">
      <div class="acct-row">
        <dt>{{ t("billing.account.status") }}</dt>
        <dd>
          <strong :class="billingState.isPremium ? 'pos' : ''">
            {{ billingState.isPremium ? t("billing.account.premium") : t("billing.account.free") }}
          </strong>
          <span v-if="billingState.subscriptionStatus" class="muted"> · {{ billingState.subscriptionStatus }}</span>
        </dd>
      </div>
      <div v-if="billingState.isPremium && billingState.subscriptionEnd" class="acct-row">
        <dt>{{ t("billing.account.nextBilling") }}</dt>
        <dd>{{ dateTimeStr(billingState.subscriptionEnd) }}</dd>
      </div>
    </dl>
    <p v-if="billingState.subscriptionStatus === 'past_due'" class="violations" role="alert">
      {{ t("billing.account.pastDue") }}
    </p>
    <p v-else-if="billingState.subscriptionStatus === 'canceled'" class="acct-hint">
      {{ t("billing.account.canceled") }}
    </p>
    <button v-if="!billingState.isPremium" class="btn acct-restart" type="button" @click="goPricing">
      {{ t("billing.account.upgrade") }}
    </button>
    <button
      v-else
      class="btn acct-restart"
      type="button"
      :disabled="openingPortal"
      @click="openPortal"
    >
      {{ openingPortal ? t("billing.account.opening") : t("billing.account.manage") }}
    </button>
    <p v-if="portalError" class="violations" role="alert">{{ portalError }}</p>

    <!-- Feature 3: bring-your-own AI API key (premium AI trading). -->
    <AiKeySection />

    <!-- End-user 2FA (TOTP), opt-in. -->
    <TwoFactorSection />

    <h3 class="acct-sub">{{ t("onboarding.account.title") }}</h3>
    <p class="acct-hint">{{ t("onboarding.account.hint") }}</p>
    <p v-if="restartError" class="violations" role="alert">{{ restartError }}</p>
    <button class="btn acct-restart" type="button" :disabled="restarting" @click="restartTutorial">
      {{ t("onboarding.account.restart") }}
    </button>

    <h3 class="acct-sub">{{ t("account.changePassword") }}</h3>
    <form class="acct-form" @submit.prevent="submit">
      <label class="acct-field">
        <span>{{ t("account.currentPassword") }}</span>
        <input v-model="current" :type="showPw ? 'text' : 'password'" class="acct-input" autocomplete="current-password" />
      </label>
      <label class="acct-field">
        <span>{{ t("account.newPassword") }}</span>
        <input v-model="next" :type="showPw ? 'text' : 'password'" class="acct-input" autocomplete="new-password" />
      </label>
      <PasswordStrengthMeter v-if="next.length > 0" :password="next" />
      <label class="acct-field">
        <span>{{ t("account.confirmPassword") }}</span>
        <input v-model="confirm" :type="showPw ? 'text' : 'password'" class="acct-input" autocomplete="new-password" />
      </label>
      <p v-if="confirm.length > 0 && !matches" class="violations">{{ t("account.mismatch") }}</p>

      <label class="acct-show">
        <input v-model="showPw" type="checkbox" />
        {{ showPw ? t("account.hide") : t("account.show") }}
      </label>

      <p v-if="error" class="violations" role="alert">{{ error }}</p>
      <p v-if="success" class="acct-success" role="status">{{ t("account.success") }}</p>

      <button class="btn primary acct-submit" type="submit" :disabled="!canSubmit">
        {{ submitting ? t("account.submitting") : t("account.submit") }}
      </button>
    </form>

    <!-- GDPR: data export + account deletion. -->
    <h3 class="acct-sub">{{ t("account.gdpr.title") }}</h3>

    <p class="acct-hint">{{ t("account.gdpr.exportHint") }}</p>
    <p v-if="exportError" class="violations" role="alert">{{ exportError }}</p>
    <button class="btn acct-restart" type="button" :disabled="exporting" @click="downloadMyData">
      {{ exporting ? t("account.gdpr.exporting") : t("account.gdpr.exportButton") }}
    </button>

    <div class="acct-danger">
      <h4 class="acct-danger-title">{{ t("account.gdpr.deleteTitle") }}</h4>
      <p class="acct-hint">{{ t("account.gdpr.deleteHint") }}</p>
      <p class="violations acct-wallet-warning" role="alert">{{ t("account.gdpr.walletWarning") }}</p>

      <form class="acct-form" @submit.prevent="deleteAccount">
        <label class="acct-field">
          <span>{{ t("account.gdpr.confirmPhraseLabel", { phrase: CONFIRM_PHRASE }) }}</span>
          <input v-model="deleteConfirmText" type="text" class="acct-input" autocomplete="off" />
        </label>
        <label class="acct-field">
          <span>{{ t("account.gdpr.confirmPasswordLabel") }}</span>
          <input v-model="deletePassword" type="password" class="acct-input" autocomplete="current-password" />
        </label>

        <p v-if="deleteError" class="violations" role="alert">{{ deleteError }}</p>

        <button class="btn danger acct-submit" type="submit" :disabled="!canDelete">
          {{ deleting ? t("account.gdpr.deleting") : t("account.gdpr.deleteButton") }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
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
.acct-sub {
  border-top: 1px solid var(--line);
  padding-top: 16px;
  margin: 0 0 12px;
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
.acct-hint {
  color: var(--muted);
  font-size: 13px;
  margin: 0 0 10px;
}
.acct-restart {
  min-height: 44px;
  margin-bottom: 18px;
}
.acct-danger {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid #5e1f28;
  border-radius: 10px;
  background: #1a0e11;
}
.acct-danger-title {
  margin: 0 0 6px;
  color: var(--neg);
  font-size: 14px;
}
.acct-wallet-warning {
  font-weight: 600;
}
</style>
