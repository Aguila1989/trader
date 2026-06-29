<script setup lang="ts">
// Global-header wallet chip (Feature 3): the active wallet's public key
// (truncated first4…last4) + its XLM balance. Clicking copies the FULL public
// key to the clipboard. Reads the per-user walletState (authoritative), so it
// shows the logged-in user's own wallet - not the global SSE snapshot account.
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { walletState } from "../../wallet/walletState";

const { t } = useI18n();
const justCopied = ref(false);

const short = computed(() =>
  walletState.publicKey ? `${walletState.publicKey.slice(0, 4)}…${walletState.publicKey.slice(-4)}` : "",
);
const balance = computed(() =>
  walletState.funded && walletState.xlmBalance != null
    ? `${Number(walletState.xlmBalance).toFixed(2)} XLM`
    : null,
);

async function copy(): Promise<void> {
  if (!walletState.publicKey) return;
  try {
    await navigator.clipboard.writeText(walletState.publicKey);
    justCopied.value = true;
    setTimeout(() => (justCopied.value = false), 1500);
  } catch {
    /* clipboard blocked - ignore */
  }
}
</script>

<template>
  <button
    v-if="walletState.configured"
    class="wallet-chip"
    type="button"
    :title="t('walletSetup.chipCopyTitle')"
    @click="copy"
  >
    <span class="wc-dot" aria-hidden="true">◆</span>
    <code class="wc-key">{{ short }}</code>
    <span v-if="balance" class="wc-bal">{{ balance }}</span>
    <span class="wc-copied" :class="{ show: justCopied }">{{ t("walletSetup.chipCopied") }}</span>
  </button>
</template>

<style scoped>
.wallet-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--text);
  font-size: 13px;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s;
}
.wallet-chip:hover {
  border-color: var(--accent);
}
.wc-dot {
  color: var(--accent);
  font-size: 11px;
}
.wc-key {
  font-family: monospace;
  font-size: 12px;
}
.wc-bal {
  color: var(--muted);
}
.wc-copied {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--pos);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.wc-copied.show {
  opacity: 1;
}
</style>
