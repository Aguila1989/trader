<script setup lang="ts">
// Catch-all 404. Reached via the router's `/:pathMatch(.*)*` route for any URL
// that doesn't match a known page (broken link, stale bookmark, typo). Marked
// public+standalone in the router (same as the Academy) so it renders with the
// sidebar but no trading header, and works for logged-out visitors too - a
// dead link shouldn't force a login first. Dependency-free: no store/API calls.
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();

onMounted(() => {
  document.title = `${t("notFound.title")} · Atrium`;
});

function goBack(): void {
  if (window.history.length > 1) router.back();
  else void router.push("/").catch(() => {});
}
</script>

<template>
  <main class="page nf-page">
    <div class="panel nf-card">
      <p class="nf-code">404</p>
      <h1 class="page-title">{{ t("notFound.heading") }}</h1>
      <p class="nf-body muted">{{ t("notFound.body") }}</p>
      <div class="nf-actions">
        <button type="button" class="btn primary" @click="goBack">{{ t("notFound.goBack") }}</button>
        <router-link class="btn" to="/">{{ t("notFound.backHome") }}</router-link>
        <router-link class="btn" to="/academy">{{ t("notFound.backAcademy") }}</router-link>
      </div>
    </div>
  </main>
</template>

<style scoped>
.nf-page {
  min-height: calc(100vh - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nf-card {
  width: 100%;
  max-width: 460px;
  padding: 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.nf-code {
  margin: 0;
  font-size: 44px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}
.nf-body {
  margin: 0 0 8px;
  font-size: 14px;
}
.nf-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}
.nf-actions .btn {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
