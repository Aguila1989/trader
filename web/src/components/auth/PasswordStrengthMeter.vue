<script setup lang="ts">
// Live password strength + per-rule checklist for the register / reset screens.
// Uses the client mirror of the server policy; the server stays authoritative.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { checkPassword } from "../../auth/passwordPolicy";

const props = defineProps<{ password: string }>();
const { t } = useI18n();
const check = computed(() => checkPassword(props.password));
</script>

<template>
  <div class="pw-strength" aria-live="polite">
    <div v-if="password.length > 0" class="pw-meter">
      <div class="pw-bars">
        <span
          v-for="i in 4"
          :key="i"
          class="pw-bar"
          :class="[`s${check.score}`, { on: i <= check.score }]"
        ></span>
      </div>
      <span class="pw-strength-label" :class="`s${check.score}`">
        {{ t("auth.strength.label") }}: {{ t(`auth.strength.${check.strength}`) }}
      </span>
    </div>
    <ul class="pw-rules">
      <li v-for="r in check.results" :key="r.id" :class="{ ok: r.ok }">
        <span class="pw-tick" aria-hidden="true">{{ r.ok ? "✓" : "○" }}</span>
        {{ t(`auth.rules.${r.id}`) }}
      </li>
    </ul>
  </div>
</template>
