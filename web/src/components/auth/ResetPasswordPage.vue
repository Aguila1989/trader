<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import AuthLayout from "./AuthLayout.vue";
import PasswordStrengthMeter from "./PasswordStrengthMeter.vue";
import { resetPassword } from "../../auth/session";
import { checkPassword } from "../../auth/passwordPolicy";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const token = ref("");
const password = ref("");
const confirm = ref("");
const error = ref("");
const loading = ref(false);
const done = ref(false);

const pwValid = computed(() => checkPassword(password.value).valid);
const canSubmit = computed(() => pwValid.value && password.value === confirm.value && !loading.value);

onMounted(() => {
  const q = route.query.token;
  token.value = typeof q === "string" ? q : "";
  // Strip the token from the URL so it doesn't linger in history / get shared.
  if (token.value) void router.replace({ path: "/reset-password" });
});

async function submit(): Promise<void> {
  error.value = "";
  loading.value = true;
  const r = await resetPassword(token.value, password.value, confirm.value);
  loading.value = false;
  if (r.ok) done.value = true;
  else error.value = r.data.error || t("auth.genericError");
}
</script>

<template>
  <AuthLayout>
    <h1 class="auth-title">{{ t("auth.reset.title") }}</h1>

    <template v-if="done">
      <p class="auth-success" role="status">{{ t("auth.verify.success") }}</p>
      <router-link class="btn primary auth-submit" to="/login">{{ t("auth.reset.toLogin") }}</router-link>
    </template>

    <template v-else-if="!token">
      <p class="auth-error" role="alert">{{ t("auth.reset.missingToken") }}</p>
      <router-link class="btn auth-submit" to="/forgot-password">{{ t("auth.forgot.title") }}</router-link>
    </template>

    <template v-else>
      <p class="auth-sub muted">{{ t("auth.reset.subtitle") }}</p>
      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span>{{ t("auth.reset.password") }}</span>
          <input v-model="password" type="password" autocomplete="new-password" required autofocus />
        </label>
        <PasswordStrengthMeter :password="password" />
        <label class="auth-field">
          <span>{{ t("auth.reset.confirm") }}</span>
          <input v-model="confirm" type="password" autocomplete="new-password" required />
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="btn primary auth-submit" type="submit" :disabled="!canSubmit">
          {{ loading ? t("auth.reset.submitting") : t("auth.reset.submit") }}
        </button>
      </form>
    </template>
  </AuthLayout>
</template>
