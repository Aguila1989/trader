<script setup lang="ts">
import { ref } from "vue";
import { api, ApiError } from "../api";

const emit = defineEmits<{ (e: "loggedIn"): void }>();

const email = ref("");
const password = ref("");
const totp = ref("");
const error = ref("");
const busy = ref(false);

async function submit(): Promise<void> {
  error.value = "";
  busy.value = true;
  try {
    await api.login(email.value.trim(), password.value, totp.value.trim());
    emit("loggedIn");
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) error.value = "Invalid credentials.";
      else if (err.status === 429) error.value = "Too many failed attempts. Try again later.";
      else if (err.status === 503) error.value = "Admin access is not configured on this server.";
      else error.value = err.message;
    } else {
      error.value = "Login failed. Please try again.";
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login-wrap">
    <form class="panel login-card login-form" @submit.prevent="submit">
      <h1 class="login-title">Atrium Admin</h1>
      <p class="login-sub">Operator backoffice — sign in with your admin credentials and TOTP code.</p>

      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" autocomplete="username" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <label class="field">
        <span>6-digit code</span>
        <input
          v-model="totp"
          type="text"
          inputmode="numeric"
          pattern="[0-9]{6}"
          maxlength="6"
          autocomplete="one-time-code"
          class="mono"
          required
        />
      </label>

      <p v-if="error" class="error-text">{{ error }}</p>

      <button type="submit" class="btn primary" :disabled="busy">
        {{ busy ? "Signing in…" : "Sign in" }}
      </button>
    </form>
  </div>
</template>
