<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import AuthLayout from "./AuthLayout.vue";
import PasswordStrengthMeter from "./PasswordStrengthMeter.vue";
import { register } from "../../auth/session";
import { checkPassword } from "../../auth/passwordPolicy";

const { t } = useI18n();
const route = useRoute();

// Feature 1 (2026-07): arriving with ?redirect= (e.g. from the Academy landing
// CTA) must survive the register -> login hop, so the user lands back where
// they started after signing in. Same internal-path-only rule as LoginPage's
// safeRedirect: never forward an absolute/protocol-relative URL.
const loginTo = computed(() => {
  const r = typeof route.query.redirect === "string" ? route.query.redirect : "";
  const safe = r.startsWith("/") && !r.startsWith("//") ? r : "";
  return safe ? { path: "/login", query: { redirect: safe } } : { path: "/login" };
});

const email = ref("");
const password = ref("");
const confirm = ref("");
const error = ref("");
const loading = ref(false);
const done = ref(false);
const doneMessage = ref("");
const verificationRequired = ref(false);

// Client-side pre-checks (the server re-validates authoritatively).
const pwValid = computed(() => checkPassword(password.value).valid);
const canSubmit = computed(
  () => email.value.length > 0 && pwValid.value && password.value === confirm.value && !loading.value,
);

async function submit(): Promise<void> {
  error.value = "";
  if (password.value !== confirm.value) {
    error.value = t("auth.genericError");
  }
  loading.value = true;
  const r = await register(email.value, password.value, confirm.value);
  loading.value = false;
  if (r.ok) {
    done.value = true;
    doneMessage.value = r.data.message || "";
    verificationRequired.value = Boolean((r.data as { verificationRequired?: boolean }).verificationRequired);
  } else {
    error.value = r.data.error || t("auth.genericError");
  }
}
</script>

<template>
  <AuthLayout>
    <template v-if="!done">
      <h1 class="auth-title">{{ t("auth.register.title") }}</h1>
      <p class="auth-sub muted">{{ t("auth.register.subtitle") }}</p>

      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span>{{ t("auth.register.email") }}</span>
          <input v-model="email" type="email" autocomplete="email" required autofocus />
        </label>
        <label class="auth-field">
          <span>{{ t("auth.register.password") }}</span>
          <input v-model="password" type="password" autocomplete="new-password" required />
        </label>
        <p class="auth-req-title muted">{{ t("auth.register.requirements") }}</p>
        <PasswordStrengthMeter :password="password" />
        <label class="auth-field">
          <span>{{ t("auth.register.confirm") }}</span>
          <input v-model="confirm" type="password" autocomplete="new-password" required />
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="btn primary auth-submit" type="submit" :disabled="!canSubmit">
          {{ loading ? t("auth.register.submitting") : t("auth.register.submit") }}
        </button>
      </form>

      <div class="auth-links">
        <span class="muted">
          {{ t("auth.register.haveAccount") }}
          <router-link :to="loginTo">{{ t("auth.register.loginLink") }}</router-link>
        </span>
      </div>
    </template>

    <template v-else>
      <h1 class="auth-title">{{ t("auth.register.title") }}</h1>
      <p class="auth-success" role="status">{{ doneMessage }}</p>
      <p v-if="verificationRequired" class="auth-sub muted">{{ t("auth.register.verifyNotice") }}</p>
      <router-link class="btn primary auth-submit" :to="loginTo">{{ t("auth.register.loginLink") }}</router-link>
    </template>
  </AuthLayout>
</template>
