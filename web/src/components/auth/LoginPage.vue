<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import AuthLayout from "./AuthLayout.vue";
import { login } from "../../auth/session";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const error = ref("");
const loading = ref(false);

// Open-redirect guard: only ever follow an INTERNAL absolute path.
function safeRedirect(p: unknown): string {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/";
}

async function submit(): Promise<void> {
  error.value = "";
  loading.value = true;
  const r = await login(email.value, password.value, rememberMe.value);
  loading.value = false;
  if (r.ok) {
    router.push(safeRedirect(route.query.redirect));
  } else {
    error.value = r.data.error || t("auth.genericError");
  }
}
</script>

<template>
  <AuthLayout>
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
        <router-link to="/register">{{ t("auth.login.registerLink") }}</router-link>
      </span>
    </div>
  </AuthLayout>
</template>
