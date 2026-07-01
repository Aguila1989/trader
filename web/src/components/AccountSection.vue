<script setup lang="ts">
// Account section of the Settings panel: read-only identity (email + account
// creation date) and the change-password form. Reuses the same password policy
// + strength meter as registration. The server is authoritative: it verifies the
// current password (generic error on mismatch), enforces the policy, revokes all
// OTHER sessions, keeps this one alive, and audit-logs the change.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { authApi } from "../api";
import { session } from "../auth/session";
import { checkPassword } from "../auth/passwordPolicy";
import { dateTimeStr } from "../format";
import PasswordStrengthMeter from "./auth/PasswordStrengthMeter.vue";

const { t } = useI18n();

// --- read-only identity ---
const email = ref(session.user?.email ?? "");
const createdAt = ref<string | null>(null);
onMounted(async () => {
  const r = await authApi.account();
  if (r.ok && r.data.user) {
    email.value = r.data.user.email;
    createdAt.value = r.data.user.createdAt;
  }
});

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
</style>
