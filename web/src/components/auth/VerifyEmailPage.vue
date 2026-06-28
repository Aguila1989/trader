<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import AuthLayout from "./AuthLayout.vue";
import { verifyEmail } from "../../auth/session";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const state = ref<"verifying" | "success" | "failed">("verifying");

onMounted(async () => {
  const q = route.query.token;
  const token = typeof q === "string" ? q : "";
  if (token) void router.replace({ path: "/verify-email" }); // strip token from URL
  if (!token) {
    state.value = "failed";
    return;
  }
  const r = await verifyEmail(token);
  state.value = r.ok ? "success" : "failed";
});
</script>

<template>
  <AuthLayout>
    <h1 class="auth-title">{{ t("auth.brand") }}</h1>
    <p v-if="state === 'verifying'" class="auth-sub muted">{{ t("auth.verify.verifying") }}</p>
    <p v-else-if="state === 'success'" class="auth-success" role="status">{{ t("auth.verify.success") }}</p>
    <p v-else class="auth-error" role="alert">{{ t("auth.verify.failed") }}</p>

    <router-link v-if="state !== 'verifying'" class="btn primary auth-submit" to="/login">
      {{ t("auth.verify.toLogin") }}
    </router-link>
  </AuthLayout>
</template>
