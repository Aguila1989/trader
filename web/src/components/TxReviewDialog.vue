<script setup lang="ts">
// Non-custodial: the transaction-review screen. The server BUILDS an unsigned tx;
// this shows the user EXACTLY what they are about to sign (full unelided
// addresses, every operation, the fee) before they approve. Presentational: the
// parent handles unlock + sign + submit on `confirm`. Modelled on ConfirmDialog.
import { onBeforeUnmount, onMounted, ref } from "vue";
import { acquireScrollLock, releaseScrollLock } from "../ui/uiState";
import type { DecodedTx } from "../wallet/xdrDecode";

defineProps<{ decoded: DecodedTx; busy?: boolean; error?: string | null }>();
// `confirm` carries the wallet passphrase so the parent can unlock the on-device
// key, sign, and submit. The key is never held here; it is decrypted per-signature.
const emit = defineEmits<{ confirm: [passphrase: string]; cancel: [] }>();
const passphrase = ref("");

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") emit("cancel");
}
onMounted(() => {
  acquireScrollLock();
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  releaseScrollLock();
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div class="tx-back" @click.self="emit('cancel')">
      <div class="tx-card" role="alertdialog" aria-modal="true" aria-label="Review transaction">
        <h2 class="tx-title">Review &amp; sign</h2>
        <p class="tx-sub">
          You are signing this on your device. The server prepared it but cannot sign it —
          check every detail before you approve.
        </p>

        <div v-for="(op, i) in decoded.ops" :key="i" class="tx-op">
          <div class="tx-op-type">{{ op.type }}</div>
          <div v-for="f in op.fields" :key="f.label" class="tx-row">
            <span class="tx-label">{{ f.label }}</span>
            <span class="tx-value">{{ f.value }}</span>
          </div>
        </div>

        <div class="tx-meta">
          <div class="tx-row"><span class="tx-label">From</span><span class="tx-value">{{ decoded.source }}</span></div>
          <div v-if="decoded.memo" class="tx-row"><span class="tx-label">Memo</span><span class="tx-value">{{ decoded.memo }}</span></div>
          <div class="tx-row"><span class="tx-label">Network fee</span><span class="tx-value">{{ decoded.fee }} stroops</span></div>
        </div>

        <label class="tx-pass">
          <span>Wallet passphrase</span>
          <input
            v-model="passphrase"
            type="password"
            autocomplete="off"
            spellcheck="false"
            placeholder="Unlock your device key to sign"
            @keyup.enter="!busy && passphrase && emit('confirm', passphrase)"
          />
        </label>

        <p v-if="error" class="tx-error">{{ error }}</p>

        <div class="tx-actions">
          <button class="btn tx-btn" type="button" :disabled="busy" @click="emit('cancel')">Cancel</button>
          <button
            class="btn tx-btn primary"
            type="button"
            :disabled="busy || !passphrase"
            @click="emit('confirm', passphrase)"
          >
            {{ busy ? "Signing…" : "Sign &amp; submit" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.tx-back {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 18, 0.66);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
.tx-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 20px;
  width: min(94vw, 560px);
  max-height: calc(100vh - 48px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}
.tx-title {
  margin: 0 0 6px;
  font-size: 17px;
  color: var(--text);
}
.tx-sub {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}
.tx-op {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.tx-op-type {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin-bottom: 6px;
}
.tx-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  padding: 2px 0;
}
.tx-label {
  color: var(--muted);
  flex: 0 0 auto;
}
.tx-value {
  color: var(--text);
  text-align: right;
  word-break: break-all;
}
.tx-meta {
  border-top: 1px solid var(--line);
  padding-top: 10px;
  margin-top: 2px;
}
.tx-error {
  color: var(--neg);
  font-size: 13px;
  margin: 10px 0 0;
}
.tx-pass {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 14px;
  font-size: 13px;
  color: var(--muted);
}
.tx-pass input {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 9px 10px;
  font-family: ui-monospace, monospace;
}
.tx-pass input:focus {
  outline: none;
  border-color: var(--accent);
}
.tx-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.tx-btn {
  min-height: 44px;
  min-width: 120px;
}
</style>
