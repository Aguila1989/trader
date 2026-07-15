<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import AuthLayout from "./AuthLayout.vue";
import { login, verifyTwoFactor } from "../../auth/session";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const error = ref("");
const loading = ref(false);

// Two-step flow: "password" (the normal form) -> "totp" (only reached when the
// account has 2FA enabled). The challenge is held in memory only - it is a
// short-lived, narrowly-scoped token that proves the password step already
// passed, never a session and never persisted.
const step = ref<"password" | "totp">("password");
const challenge = ref("");
const code = ref("");

// Backup-code toggle: relaxes the input from a strict 6-digit authenticator
// code to the "XXXXX-XXXXX" one-time recovery code format. Both submit
// through the exact same verifyTwoFactor call - the server tells the two
// formats apart (see auth/service.ts verifyTwoFactor).
const usingBackupCode = ref(false);

const canSubmitCode = computed(() =>
  usingBackupCode.value ? code.value.trim().replace(/[\s-]/g, "").length >= 8 : code.value.length === 6,
);

function toggleBackupCode(): void {
  usingBackupCode.value = !usingBackupCode.value;
  code.value = "";
  error.value = "";
}

// Open-redirect guard: only ever follow an INTERNAL absolute path.
function safeRedirect(p: unknown): string {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/";
}

// Feature 1 (2026-07): keep ?redirect= alive across the login <-> register hop
// so an Academy-landing visitor ends up back at the lesson they wanted.
const registerTo = computed(() => {
  const safe = safeRedirect(route.query.redirect);
  return safe !== "/" ? { path: "/register", query: { redirect: safe } } : { path: "/register" };
});

async function submit(): Promise<void> {
  error.value = "";
  loading.value = true;
  const r = await login(email.value, password.value, rememberMe.value);
  loading.value = false;
  if (r.ok && r.data.twoFactorRequired && r.data.challenge) {
    challenge.value = r.data.challenge;
    step.value = "totp";
    return;
  }
  if (r.ok) {
    router.push(safeRedirect(route.query.redirect));
  } else {
    error.value = r.data.error || t("auth.genericError");
  }
}

async function submitTotp(): Promise<void> {
  error.value = "";
  loading.value = true;
  const r = await verifyTwoFactor(challenge.value, code.value, rememberMe.value);
  loading.value = false;
  if (r.ok) {
    router.push(safeRedirect(route.query.redirect));
  } else {
    error.value = r.data.error || t("auth.genericError");
  }
}

function backToPassword(): void {
  step.value = "password";
  code.value = "";
  error.value = "";
  challenge.value = "";
  usingBackupCode.value = false;
}
</script>

<template>
  <AuthLayout>
    <template v-if="step === 'password'">
      <h1 class="auth-title">{{ t("auth.login.title") }}</h1>
      <p class="auth-sub muted">{{ t("auth.login.subtitle") }}</p>

      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span>{{ t("auth.login.email") }}</span>
          <input v-model="email" type="email" autocomplete="email" required autofocus />
        </label>
        <label class="auth-field">
          <span>{{ t("auth.login.password") }}</span>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>

        <label class="auth-check">
          <input v-model="rememberMe" type="checkbox" />
          <span>{{ t("auth.login.rememberMe") }}</span>
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="btn primary auth-submit" type="submit" :disabled="loading">
          {{ loading ? t("auth.login.submitting") : t("auth.login.submit") }}
        </button>
      </form>

      <div class="auth-links">
        <router-link to="/forgot-password">{{ t("auth.login.forgot") }}</router-link>
        <span class="muted">
          {{ t("auth.login.noAccount") }}
          <router-link :to="registerTo">{{ t("auth.login.registerLink") }}</router-link>
        </span>
      </div>
    </template>

    <template v-else>
      <h1 class="auth-title">{{ t("twoFa.login.title") }}</h1>
      <p class="auth-sub muted">{{ usingBackupCode ? t("twoFa.login.backupSubtitle") : t("twoFa.login.subtitle") }}</p>

      <form class="auth-form" @submit.prevent="submitTotp">
        <label class="auth-field">
          <span>{{ usingBackupCode ? t("twoFa.login.backupCodeLabel") : t("twoFa.login.codeLabel") }}</span>
          <input
            v-if="!usingBackupCode"
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern="[0-9]*"
            required
            autofocus
          />
          <input
            v-else
            v-model="code"
            type="text"
            inputmode="text"
            autocomplete="one-time-code"
            maxlength="11"
            :placeholder="t('twoFa.login.backupCodePlaceholder')"
            required
            autofocus
          />
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="btn primary auth-submit" type="submit" :disabled="loading || !canSubmitCode">
          {{ loading ? t("twoFa.login.submitting") : t("twoFa.login.submit") }}
        </button>
      </form>

      <div class="auth-links">
        <a href="#" @click.prevent="toggleBackupCode">
          {{ usingBackupCode ? t("twoFa.login.useAuthenticator") : t("twoFa.login.useBackupCode") }}
        </a>
        <a href="#" @click.prevent="backToPassword">{{ t("twoFa.login.back") }}</a>
      </div>
    </template>
  </AuthLayout>
</template>
