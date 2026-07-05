<script setup lang="ts">
// Feature 5: the token detail PAGE (/token/:assetCode/:assetIssuer). Owns the
// route <-> store glue: it derives the asset spec from the URL (so the page is
// bookmarkable/shareable), loads it via the existing store plumbing, keeps the
// ORDER BOOK fresh on a 30s cadence while mounted, and renders the
// history-aware back bar ("← Back to Portfolio" etc. from history.state's
// tokenBack, written by goToToken()). The heavy lifting (book, chart,
// stop-loss form) stays in TokenDetail.vue unchanged.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { assetFromParams, type TokenBackContext } from "../token/navigation";
import TokenDetail from "./TokenDetail.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useTraderStore();

const BOOK_REFRESH_MS = 30_000;

const asset = computed(() =>
  assetFromParams(String(route.params.assetCode ?? ""), String(route.params.assetIssuer ?? "")),
);

// The origin recorded by goToToken(); absent on deep links/bookmarks/reloads.
const backContext = ref<TokenBackContext | null>(null);
function readBackContext(): void {
  const v = (history.state as { tokenBack?: unknown } | null)?.tokenBack;
  backContext.value = v === "portfolio" || v === "trading" || v === "whitelist" ? v : null;
}

const backLabel = computed(() =>
  backContext.value ? t(`tokenPage.backTo.${backContext.value}`) : t("tokenPage.back"),
);

function goBack(): void {
  // Real browser history when we have somewhere to go back TO (the page we
  // came from); a deep link / fresh tab falls back to the Trading home.
  if (backContext.value !== null || window.history.length > 1) router.back();
  else void router.push("/").catch(() => {});
}

let refreshTimer: number | null = null;

function load(): void {
  if (!asset.value) return;
  store.openToken(asset.value);
}

onMounted(() => {
  readBackContext();
  load();
  refreshTimer = window.setInterval(() => {
    // Keep the order book live (spec: every 30s) - but not while hidden.
    if (!document.hidden) void store.loadTokenBook();
  }, BOOK_REFRESH_MS);
});

// Same route, different token (e.g. a link inside the page later): reload.
watch(asset, () => {
  readBackContext();
  load();
});

onBeforeUnmount(() => {
  if (refreshTimer !== null) window.clearInterval(refreshTimer);
  store.closeToken();
});
</script>

<template>
  <main class="page token-page">
    <!-- Always-visible back bar (sticky on mobile, inside the safe area). -->
    <div class="tp-bar">
      <button class="btn tp-back" type="button" @click="goBack">← {{ backLabel }}</button>
    </div>
    <TokenDetail />
  </main>
</template>

<style scoped>
.token-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tp-bar {
  display: flex;
  align-items: center;
}
.tp-back {
  min-height: 44px;
  min-width: 44px;
}

/* Mobile: full-screen page; the back button stays pinned at the top, offset
   right of the fixed hamburger (44px at left:8px) so they never overlap. */
@media (max-width: 767px) {
  .tp-bar {
    position: sticky;
    top: calc(4px + env(safe-area-inset-top));
    z-index: 30;
    margin-left: 56px;
  }
  .tp-back {
    background: var(--panel);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
  }
}
</style>
