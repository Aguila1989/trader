<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import AuthLayout from "./AuthLayout.vue";
import { forgotPassword } from "../../auth/session";

const { t } = useI18n();

const email = ref("");
const loading = ref(false);
const done = ref(false);
const message = ref("");

async function submit(): Promise<void> {
  loading.value = true;
  const r = await forgotPassword(email.value);
  loading.value = false;
  // Always generic, whether or not the account exists.
  message.value = r.data.message || "";
  done.value = true;
}
</script>

<template>
  <AuthLayout>
    <h1 class="auth-title">{{ t("auth.forgot.title") }}</h1>

    <template v-if="!done">
      <p class="auth-sub muted">{{ t("auth.forgot.subtitle") }}</p>
      <form class="auth-form" @submit.prevent="submit">
        <label class="auth-field">
          <span>{{ t("auth.forgot.email") }}</span>
          <input v-model="email" type="email" autocomplete="email" required autofocus />
        </label>
        <button class="btn primary auth-submit" type="submit" :disabled="loading">
          {{ loading ? t("auth.forgot.submitting") : t("auth.forgot.submit") }}
        </button>
      </form>
    </template>

    <template v-else>
      <p class="auth-success" role="status">{{ message }}</p>
    </template>

    <div class="auth-links">
      <router-link to="/login">{{ t("auth.forgot.back") }}</router-link>
    </div>
  </AuthLayout>
</template>
