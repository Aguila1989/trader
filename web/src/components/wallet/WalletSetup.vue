<script setup lang="ts">
// Wallet setup + management (Feature 3). A logged-in user is routed here by the
// router guard until they have an active wallet; it also doubles as the wallet
// management screen (fund / replace) once configured. Reuses AuthLayout so it
// matches the auth screens' centered-card chrome. No secret is ever stored
// client-side: the one returned by /create is shown once for the user to save.
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import AuthLayout from "../auth/AuthLayout.vue";
import { walletApi } from "../../api";
import { walletState, loadWalletStatus, refreshChains } from "../../wallet/walletState";

const { t } = useI18n();
const router = useRouter();

type View = "choose" | "create" | "import" | "manage" | "create-nc" | "sol-create" | "sol-import";
const view = ref<View>("choose");

const loading = ref(false);
const error = ref("");
const copied = ref("");

// Create flow: the generated keypair (secret shown ONCE) + the last-4 confirm.
const generated = ref<{ publicKey: string; secret: string } | null>(null);
const last4 = ref("");
// Fund-safety fix: the last-4 check alone is weak proof the secret was
// actually saved somewhere recoverable. A mandatory acknowledgement checkbox
// gates the confirm button in addition to (not instead of) the last-4 check.
const secretSavedAck = ref(false);

// NON-CUSTODIAL create: key generated + encrypted ON THIS DEVICE (never sent to
// the server); the server stores only the public key. The localKey module is
// dynamically imported so stellar-base stays out of this route's initial chunk.
const ncGen = ref<{ publicKey: string; secret: string } | null>(null);
const ncPass = ref("");
const ncPassConfirm = ref("");
const ncBackupAck = ref(false);

// Import / replace inputs.
const importSecret = ref("");
const replaceSecret = ref("");
const replacePassword = ref("");
// AUDIT-007: distinct confirmation for the destructive replace (last 4 of the
// NEW secret, mirroring the create flow's write-it-down check).
const replaceConfirm4 = ref("");
const replacedMsg = ref("");

// MULTI-CHAIN (2026-07): the setup screen is also where the user picks their
// chain(s). Stellar is required (the trading chain — the router gate keys on
// it); Solana is an optional, NON-CUSTODIAL-ONLY add-on whose key is generated
// on this device (solanaKey/localKey, dynamically imported like the Stellar
// non-custodial flow so stellar-base stays out of the initial chunk).
const solGen = ref<{ publicKey: string; secret: string } | null>(null);
const solImportSecret = ref("");
// Two-step removal confirm: the chain id whose Remove button was clicked.
const removeArm = ref("");

const solanaRow = computed(() => walletState.chains.find((c) => c.chain === "solana"));
const solanaOffered = computed(() => !!solanaRow.value?.enabled || !!solanaRow.value?.configured);

const SECRET_RE = /^S[A-Z2-7]{55}$/;
const isTestnet = computed(() => walletState.network !== "public");

onMounted(async () => {
  await Promise.all([loadWalletStatus(), refreshChains()]);
  if (walletState.configured) view.value = "manage";
});

async function copy(text: string, tag: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = tag;
    setTimeout(() => (copied.value = ""), 1500);
  } catch {
    /* clipboard blocked - ignore */
  }
}

function reset(): void {
  error.value = "";
  replacedMsg.value = "";
}

async function generate(): Promise<void> {
  reset();
  secretSavedAck.value = false;
  loading.value = true;
  const r = await walletApi.create();
  loading.value = false;
  if (r.ok && r.data.publicKey && r.data.secret) {
    generated.value = { publicKey: r.data.publicKey, secret: r.data.secret };
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function confirmCreate(): Promise<void> {
  reset();
  loading.value = true;
  const r = await walletApi.confirm(last4.value.trim());
  loading.value = false;
  if (r.ok && r.data.publicKey) {
    generated.value = null;
    last4.value = "";
    secretSavedAck.value = false;
    await Promise.all([loadWalletStatus(true), refreshChains()]);
    view.value = "manage";
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

// NON-CUSTODIAL: generate a keypair on the device, then show it for backup.
async function startNc(): Promise<void> {
  reset();
  ncGen.value = null;
  ncPass.value = "";
  ncPassConfirm.value = "";
  ncBackupAck.value = false;
  view.value = "create-nc";
  loading.value = true;
  try {
    const m = await import("../../wallet/localKey");
    ncGen.value = m.generateLocalWallet();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

// Encrypt the key at rest on the device (passphrase), then register the PUBLIC
// key with the server. If the server register fails, roll back the device key so
// no orphaned local key is left behind.
async function confirmNc(): Promise<void> {
  reset();
  if (!ncGen.value) return;
  if (ncPass.value.length < 8) {
    error.value = "Passphrase must be at least 8 characters.";
    return;
  }
  if (ncPass.value !== ncPassConfirm.value) {
    error.value = "Passphrases do not match.";
    return;
  }
  loading.value = true;
  try {
    const m = await import("../../wallet/localKey");
    await m.saveLocalWallet(ncGen.value.secret, ncPass.value);
    const r = await walletApi.register(ncGen.value.publicKey);
    if (r.ok && r.data.publicKey) {
      ncGen.value = null;
      ncPass.value = "";
      ncPassConfirm.value = "";
      ncBackupAck.value = false;
      await Promise.all([loadWalletStatus(true), refreshChains()]);
      view.value = "manage";
    } else {
      await m.clearLocalWallet(); // registration failed — don't strand a device key
      error.value = r.data.error || t("walletSetup.genericError");
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

// SOLANA create: mirror of startNc/confirmNc, on the "solana" localKey slot.
// The passphrase/ack refs are shared with the Stellar non-custodial flow (only
// one of the flows is ever on screen).
async function startSolCreate(): Promise<void> {
  reset();
  solGen.value = null;
  ncPass.value = "";
  ncPassConfirm.value = "";
  ncBackupAck.value = false;
  view.value = "sol-create";
  loading.value = true;
  try {
    const m = await import("../../wallet/solanaKey");
    solGen.value = m.generateSolanaWallet();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function startSolImport(): void {
  reset();
  solImportSecret.value = "";
  ncPass.value = "";
  ncPassConfirm.value = "";
  ncBackupAck.value = false;
  view.value = "sol-import";
}

/** Leave a Solana flow: back to manage when Stellar is already configured
 *  (adding a chain from the manage screen), else back to the setup picker. */
function backFromSol(): void {
  reset();
  view.value = walletState.configured ? "manage" : "choose";
}

/** Shared tail of both Solana flows: encrypt the (normalized) secret on this
 *  device, register the ADDRESS server-side, roll the device key back if the
 *  registration fails. Returns to the right view for the setup phase. */
async function persistSolana(publicKey: string, secret: string): Promise<void> {
  if (ncPass.value.length < 8) {
    error.value = t("walletSetup.passphraseTooShort");
    return;
  }
  if (ncPass.value !== ncPassConfirm.value) {
    error.value = t("walletSetup.passphraseMismatch");
    return;
  }
  loading.value = true;
  try {
    const lk = await import("../../wallet/localKey");
    await lk.saveLocalWallet(secret, ncPass.value, "solana");
    const r = await walletApi.register(publicKey, "solana");
    if (r.ok && r.data.publicKey) {
      solGen.value = null;
      solImportSecret.value = "";
      ncPass.value = "";
      ncPassConfirm.value = "";
      ncBackupAck.value = false;
      await refreshChains();
      // Stellar (the required chain) may still be missing: back to the picker.
      view.value = walletState.configured ? "manage" : "choose";
    } else {
      await lk.clearLocalWallet("solana"); // registration failed — no orphaned device key
      error.value = r.data.error || t("walletSetup.genericError");
    }
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

async function confirmSolCreate(): Promise<void> {
  reset();
  if (!solGen.value) return;
  await persistSolana(solGen.value.publicKey, solGen.value.secret);
}

async function confirmSolImport(): Promise<void> {
  reset();
  loading.value = true;
  let wallet: { publicKey: string; secret: string };
  try {
    const m = await import("../../wallet/solanaKey");
    wallet = m.parseSolanaSecret(solImportSecret.value);
  } catch {
    error.value = t("walletSetup.solImportInvalid");
    loading.value = false;
    return;
  }
  loading.value = false;
  await persistSolana(wallet.publicKey, wallet.secret);
}

// Remove a chain wallet. Server-guarded (409 while funds remain, fail-closed on
// probe errors); on success the device-stored key for that chain is cleared too.
async function doRemoveChain(chain: string): Promise<void> {
  reset();
  loading.value = true;
  const r = await walletApi.removeChain(chain);
  loading.value = false;
  removeArm.value = "";
  if (r.ok) {
    if (chain === "stellar" || chain === "solana") {
      try {
        const lk = await import("../../wallet/localKey");
        await lk.clearLocalWallet(chain);
      } catch {
        /* best-effort device cleanup */
      }
    }
    await Promise.all([refreshChains(), loadWalletStatus(true)]);
    if (!walletState.configured) view.value = "choose";
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function doImport(): Promise<void> {
  reset();
  const s = importSecret.value.trim();
  if (!SECRET_RE.test(s)) {
    error.value = t("walletSetup.importInvalid");
    return;
  }
  loading.value = true;
  const r = await walletApi.import(s);
  loading.value = false;
  if (r.ok && r.data.publicKey) {
    importSecret.value = "";
    await Promise.all([loadWalletStatus(true), refreshChains()]);
    view.value = "manage";
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function fund(): Promise<void> {
  reset();
  loading.value = true;
  const r = await walletApi.friendbot();
  loading.value = false;
  if (r.ok) {
    await loadWalletStatus(true);
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}

async function doReplace(): Promise<void> {
  reset();
  const s = replaceSecret.value.trim();
  if (!SECRET_RE.test(s)) {
    error.value = t("walletSetup.importInvalid");
    return;
  }
  // AUDIT-007: replacing the wallet cancels every open offer + stop loss and
  // permanently swaps the signing key — require a DISTINCT confirmation step
  // (retyping the new secret's last 4, the same rigor wallet creation uses),
  // not just a warning banner above a submit button.
  if (replaceConfirm4.value.trim() !== s.slice(-4)) {
    error.value = t("walletSetup.replaceConfirmMismatch");
    return;
  }
  loading.value = true;
  const r = await walletApi.replace(s, replacePassword.value);
  loading.value = false;
  if (r.ok && r.data.publicKey) {
    replacedMsg.value = t("walletSetup.replaced", {
      offers: r.data.cancelledOffers ?? 0,
      stops: r.data.cancelledStops ?? 0,
    });
    replaceSecret.value = "";
    replacePassword.value = "";
    replaceConfirm4.value = "";
    await loadWalletStatus(true);
  } else {
    error.value = r.data.error || t("walletSetup.genericError");
  }
}
</script>

<template>
  <AuthLayout>
    <!-- 1. Choose: pick your chain(s), create or import per chain (first-time setup) -->
    <template v-if="view === 'choose'">
      <h1 class="auth-title">{{ t("walletSetup.setupTitle") }}</h1>
      <p class="auth-sub muted">{{ t("walletSetup.setupSubtitle") }}</p>

      <div class="ws-chainhead">
        <strong>Stellar</strong>
        <span class="ws-badge">{{ t("walletSetup.chainRequired") }}</span>
      </div>
      <p class="muted ws-chaindesc">{{ t("walletSetup.chainStellarDesc") }}</p>
      <div class="ws-choices">
        <button class="ws-choice" type="button" @click="reset(); view = 'create'">
          <strong>{{ t("walletSetup.createCard") }}</strong>
          <span class="muted">{{ t("walletSetup.createCardDesc") }}</span>
        </button>
        <button class="ws-choice" type="button" @click="reset(); view = 'import'">
          <strong>{{ t("walletSetup.importCard") }}</strong>
          <span class="muted">{{ t("walletSetup.importCardDesc") }}</span>
        </button>
        <!-- NON-CUSTODIAL: shown only when the server offers it (NONCUSTODIAL_MODE). -->
        <button v-if="walletState.nonCustodial" class="ws-choice" type="button" @click="startNc()">
          <strong>{{ t("walletSetup.ncCard") }}</strong>
          <span class="muted">{{ t("walletSetup.ncCardDesc") }}</span>
        </button>
      </div>

      <!-- MULTI-CHAIN: optional chains the operator offers (Solana today). A
           user can set them up now or later from the manage screen. -->
      <template v-if="solanaOffered">
        <div class="ws-chainhead">
          <strong>Solana</strong>
          <span class="ws-badge ws-badge-opt">
            {{ solanaRow?.configured ? t("walletSetup.chainConfigured") : t("walletSetup.chainOptional") }}
          </span>
        </div>
        <p class="muted ws-chaindesc">{{ t("walletSetup.solChainDesc") }}</p>
        <div v-if="!solanaRow?.configured" class="ws-choices">
          <button class="ws-choice" type="button" @click="startSolCreate()">
            <strong>{{ t("walletSetup.solCreateCard") }}</strong>
            <span class="muted">{{ t("walletSetup.solCreateCardDesc") }}</span>
          </button>
          <button class="ws-choice" type="button" @click="startSolImport()">
            <strong>{{ t("walletSetup.solImportCard") }}</strong>
            <span class="muted">{{ t("walletSetup.solImportCardDesc") }}</span>
          </button>
        </div>
        <p v-else class="muted ws-chaindesc">
          <code class="ws-key">{{ solanaRow?.publicKey }}</code>
        </p>
      </template>
    </template>

    <!-- 2. Create: generate, then show secret ONCE + last-4 confirm -->
    <template v-else-if="view === 'create'">
      <h1 class="auth-title">{{ t("walletSetup.createTitle") }}</h1>

      <template v-if="!generated">
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button class="btn primary auth-submit" type="button" :disabled="loading" @click="generate">
          {{ loading ? t("walletSetup.generating") : t("walletSetup.createCard") }}
        </button>
        <div class="auth-links">
          <a href="#" @click.prevent="reset(); view = 'choose'">{{ t("walletSetup.back") }}</a>
        </div>
      </template>

      <template v-else>
        <div class="ws-warn" role="alert">
          <strong>{{ t("walletSetup.secretWarningTitle") }}</strong>
          <p>{{ t("walletSetup.secretWarning") }}</p>
        </div>

        <label class="auth-field">
          <span>{{ t("walletSetup.publicKeyLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key">{{ generated.publicKey }}</code>
            <button class="btn ws-copy" type="button" @click="copy(generated!.publicKey, 'pub')">
              {{ copied === "pub" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <label class="auth-field">
          <span>{{ t("walletSetup.secretKeyLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key ws-secret">{{ generated.secret }}</code>
            <button class="btn ws-copy" type="button" @click="copy(generated!.secret, 'sec')">
              {{ copied === "sec" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <form class="auth-form" @submit.prevent="confirmCreate">
          <label class="ws-ack">
            <input v-model="secretSavedAck" type="checkbox" />
            <span>{{ t("walletSetup.secretSavedAck") }}</span>
          </label>
          <label class="auth-field">
            <span>{{ t("walletSetup.confirmPrompt") }}</span>
            <input
              v-model="last4"
              type="text"
              maxlength="4"
              autocomplete="off"
              :placeholder="t('walletSetup.last4Placeholder')"
            />
          </label>
          <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
          <button
            class="btn primary auth-submit"
            type="submit"
            :disabled="loading || last4.trim().length !== 4 || !secretSavedAck"
          >
            {{ t("walletSetup.confirmBtn") }}
          </button>
        </form>
      </template>
    </template>

    <!-- 2b. Create a NON-CUSTODIAL wallet (key generated + kept on this device) -->
    <template v-else-if="view === 'create-nc'">
      <h1 class="auth-title">Create a non-custodial wallet</h1>

      <template v-if="!ncGen">
        <p class="auth-sub muted">Generating a key on this device…</p>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <div class="auth-links">
          <a href="#" @click.prevent="reset(); view = 'choose'">{{ t("walletSetup.back") }}</a>
        </div>
      </template>

      <template v-else>
        <div class="ws-warn" role="alert">
          <strong>Back up your secret key now.</strong>
          <p>
            This key lives only on this device, encrypted by your passphrase. If you lose both,
            your funds are gone — we cannot recover them.
          </p>
        </div>

        <label class="auth-field">
          <span>{{ t("walletSetup.publicKeyLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key">{{ ncGen.publicKey }}</code>
            <button class="btn ws-copy" type="button" @click="copy(ncGen!.publicKey, 'ncpub')">
              {{ copied === "ncpub" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <label class="auth-field">
          <span>{{ t("walletSetup.secretKeyLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key ws-secret">{{ ncGen.secret }}</code>
            <button class="btn ws-copy" type="button" @click="copy(ncGen!.secret, 'ncsec')">
              {{ copied === "ncsec" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <form class="auth-form" @submit.prevent="confirmNc">
          <label class="auth-field">
            <span>Passphrase (encrypts the key on this device)</span>
            <input v-model="ncPass" type="password" autocomplete="new-password" placeholder="At least 8 characters" />
          </label>
          <label class="auth-field">
            <span>Confirm passphrase</span>
            <input v-model="ncPassConfirm" type="password" autocomplete="new-password" />
          </label>
          <label class="ws-ack">
            <input v-model="ncBackupAck" type="checkbox" />
            <span>I have saved my secret key somewhere safe. I understand it cannot be recovered.</span>
          </label>
          <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
          <button
            class="btn primary auth-submit"
            type="submit"
            :disabled="loading || ncPass.length < 8 || ncPass !== ncPassConfirm || !ncBackupAck"
          >
            {{ loading ? "Saving…" : "Create wallet" }}
          </button>
        </form>
      </template>
    </template>

    <!-- 2c. Create a SOLANA wallet (non-custodial only, key stays on device) -->
    <template v-else-if="view === 'sol-create'">
      <h1 class="auth-title">{{ t("walletSetup.solCreateTitle") }}</h1>

      <template v-if="!solGen">
        <p class="auth-sub muted">{{ t("walletSetup.ncGenerating") }}</p>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <div class="auth-links">
          <a href="#" @click.prevent="backFromSol()">{{ t("walletSetup.back") }}</a>
        </div>
      </template>

      <template v-else>
        <div class="ws-warn" role="alert">
          <strong>{{ t("walletSetup.ncBackupTitle") }}</strong>
          <p>{{ t("walletSetup.ncBackupWarning") }}</p>
        </div>

        <label class="auth-field">
          <span>{{ t("walletSetup.solAddressLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key">{{ solGen.publicKey }}</code>
            <button class="btn ws-copy" type="button" @click="copy(solGen!.publicKey, 'solpub')">
              {{ copied === "solpub" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <label class="auth-field">
          <span>{{ t("walletSetup.solSecretLabel") }}</span>
          <div class="ws-keyrow">
            <code class="ws-key ws-secret">{{ solGen.secret }}</code>
            <button class="btn ws-copy" type="button" @click="copy(solGen!.secret, 'solsec')">
              {{ copied === "solsec" ? t("walletSetup.copied") : t("walletSetup.copy") }}
            </button>
          </div>
        </label>

        <form class="auth-form" @submit.prevent="confirmSolCreate">
          <label class="auth-field">
            <span>{{ t("walletSetup.passphraseLabel") }}</span>
            <input v-model="ncPass" type="password" autocomplete="new-password" :placeholder="t('walletSetup.passphrasePlaceholder')" />
          </label>
          <label class="auth-field">
            <span>{{ t("walletSetup.passphraseConfirmLabel") }}</span>
            <input v-model="ncPassConfirm" type="password" autocomplete="new-password" />
          </label>
          <label class="ws-ack">
            <input v-model="ncBackupAck" type="checkbox" />
            <span>{{ t("walletSetup.ncBackupAck") }}</span>
          </label>
          <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
          <button
            class="btn primary auth-submit"
            type="submit"
            :disabled="loading || ncPass.length < 8 || ncPass !== ncPassConfirm || !ncBackupAck"
          >
            {{ loading ? t("walletSetup.ncSaving") : t("walletSetup.ncCreateBtn") }}
          </button>
        </form>
        <div class="auth-links">
          <a href="#" @click.prevent="backFromSol()">{{ t("walletSetup.back") }}</a>
        </div>
      </template>
    </template>

    <!-- 2d. Import a SOLANA wallet (Base58 secret; stays on device) -->
    <template v-else-if="view === 'sol-import'">
      <h1 class="auth-title">{{ t("walletSetup.solImportTitle") }}</h1>
      <form class="auth-form" @submit.prevent="confirmSolImport">
        <label class="auth-field">
          <span>{{ t("walletSetup.solSecretInputLabel") }}</span>
          <input
            v-model="solImportSecret"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('walletSetup.solSecretPlaceholder')"
          />
        </label>
        <label class="auth-field">
          <span>{{ t("walletSetup.passphraseLabel") }}</span>
          <input v-model="ncPass" type="password" autocomplete="new-password" :placeholder="t('walletSetup.passphrasePlaceholder')" />
        </label>
        <label class="auth-field">
          <span>{{ t("walletSetup.passphraseConfirmLabel") }}</span>
          <input v-model="ncPassConfirm" type="password" autocomplete="new-password" />
        </label>
        <label class="ws-ack">
          <input v-model="ncBackupAck" type="checkbox" />
          <span>{{ t("walletSetup.ncBackupAck") }}</span>
        </label>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button
          class="btn primary auth-submit"
          type="submit"
          :disabled="loading || !solImportSecret.trim() || ncPass.length < 8 || ncPass !== ncPassConfirm || !ncBackupAck"
        >
          {{ loading ? t("walletSetup.ncSaving") : t("walletSetup.importBtn") }}
        </button>
      </form>
      <div class="auth-links">
        <a href="#" @click.prevent="backFromSol()">{{ t("walletSetup.back") }}</a>
      </div>
    </template>

    <!-- 3. Import an existing secret -->
    <template v-else-if="view === 'import'">
      <h1 class="auth-title">{{ t("walletSetup.importTitle") }}</h1>
      <form class="auth-form" @submit.prevent="doImport">
        <label class="auth-field">
          <span>{{ t("walletSetup.secretInputLabel") }}</span>
          <input
            v-model="importSecret"
            type="password"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('walletSetup.secretInputPlaceholder')"
          />
        </label>
        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
        <button class="btn primary auth-submit" type="submit" :disabled="loading">
          {{ loading ? t("walletSetup.generating") : t("walletSetup.importBtn") }}
        </button>
      </form>
      <div class="auth-links">
        <a href="#" @click.prevent="reset(); view = 'choose'">{{ t("walletSetup.back") }}</a>
      </div>
    </template>

    <!-- 4. Manage: configured wallet (status, funding, replace) -->
    <template v-else>
      <h1 class="auth-title">{{ t("walletSetup.manageTitle") }}</h1>

      <label class="auth-field">
        <span>{{ t("walletSetup.publicKeyLabel") }}</span>
        <div class="ws-keyrow">
          <code class="ws-key">{{ walletState.publicKey }}</code>
          <button class="btn ws-copy" type="button" @click="copy(walletState.publicKey || '', 'pub')">
            {{ copied === "pub" ? t("walletSetup.copied") : t("walletSetup.copy") }}
          </button>
        </div>
      </label>

      <div class="ws-status">
        <span class="muted">{{ t("walletSetup.networkLabel") }}: <strong>{{ walletState.network }}</strong></span>
        <span class="muted">
          {{ t("walletSetup.balanceLabel") }}:
          <strong v-if="walletState.funded">{{ walletState.xlmBalance }} XLM</strong>
          <strong v-else class="neg">{{ t("walletSetup.awaitingFunding") }}</strong>
        </span>
      </div>

      <!-- Funding help when the account isn't on-ledger yet -->
      <template v-if="!walletState.funded">
        <div v-if="isTestnet" class="ws-fund">
          <strong>{{ t("walletSetup.testnetFundTitle") }}</strong>
          <button class="btn primary" type="button" :disabled="loading" @click="fund">
            {{ loading ? t("walletSetup.funding") : t("walletSetup.fundBtn") }}
          </button>
        </div>
        <div v-else class="ws-fund">
          <strong>{{ t("walletSetup.mainnetFundTitle") }}</strong>
          <p class="muted">{{ t("walletSetup.mainnetFundInstructions") }}</p>
        </div>
      </template>

      <p v-if="error" class="auth-error" role="alert">{{ error }}</p>
      <p v-if="replacedMsg" class="ws-ok" role="status">{{ replacedMsg }}</p>

      <button class="btn primary auth-submit" type="button" @click="router.push('/')">
        {{ t("walletSetup.continueBtn") }}
      </button>

      <!-- MULTI-CHAIN: every chain the platform offers (+ any the user still
           holds a wallet on). Add is always possible; REMOVE only when the
           wallet is verifiably empty (server-enforced; reason shown here). -->
      <section v-if="walletState.chains.length" class="ws-chains" :aria-label="t('walletSetup.chainsTitle')">
        <h2 class="ws-chains-title">{{ t("walletSetup.chainsTitle") }}</h2>
        <div v-for="c in walletState.chains" :key="c.chain" class="ws-chainrow">
          <div class="ws-chainmain">
            <div class="ws-chainhead">
              <strong>{{ c.displayName }}</strong>
              <span class="ws-badge" :class="{ 'ws-badge-opt': c.chain !== 'stellar' }">
                {{ c.chain === "stellar" ? t("walletSetup.chainRequired") : c.configured ? t("walletSetup.chainConfigured") : t("walletSetup.chainOptional") }}
              </span>
            </div>
            <template v-if="c.configured">
              <code class="ws-key">{{ c.publicKey }}</code>
              <span class="muted ws-chainbal">
                {{ t("walletSetup.balanceLabel") }}:
                <strong>{{ c.nativeBalance ?? "0" }} {{ c.nativeSymbol }}</strong>
              </span>
            </template>
            <span v-else class="muted ws-chainbal">{{ t("walletSetup.chainNotSetUp") }}</span>
          </div>
          <div class="ws-chainactions">
            <template v-if="!c.configured && c.enabled && c.chain === 'solana'">
              <button class="btn" type="button" @click="startSolCreate()">{{ t("walletSetup.createCard") }}</button>
              <button class="btn" type="button" @click="startSolImport()">{{ t("walletSetup.importCard") }}</button>
            </template>
            <template v-else-if="c.configured">
              <button
                class="btn danger"
                type="button"
                :disabled="loading || !c.canRemove"
                :aria-label="t('walletSetup.removeChainAria', { chain: c.displayName })"
                :title="c.canRemove ? '' : c.removeBlockReason"
                @click="removeArm = removeArm === c.chain ? '' : c.chain"
              >
                {{ t("walletSetup.removeChainBtn") }}
              </button>
            </template>
          </div>
          <p v-if="c.configured && !c.canRemove && c.removeBlockReason" class="muted ws-chainblock">
            {{ c.removeBlockReason }}
          </p>
          <!-- Two-step confirm strip for a destructive removal. -->
          <div v-if="removeArm === c.chain && c.canRemove" class="ws-warn ws-removeconfirm" role="alertdialog">
            <strong>{{ t("walletSetup.removeChainTitle", { chain: c.displayName }) }}</strong>
            <p>{{ t("walletSetup.removeChainBody", { chain: c.displayName, address: c.publicKey }) }}</p>
            <p v-if="c.clientSigned">{{ t("walletSetup.removeChainDeviceKey") }}</p>
            <div class="ws-chainactions">
              <button class="btn danger" type="button" :disabled="loading" @click="doRemoveChain(c.chain)">
                {{ t("walletSetup.removeChainConfirm") }}
              </button>
              <button class="btn" type="button" @click="removeArm = ''">{{ t("walletSetup.back") }}</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Replace wallet (password-gated, warns about cancellation) -->
      <details class="ws-replace">
        <summary>{{ t("walletSetup.replaceTitle") }}</summary>
        <div class="ws-warn" role="alert"><p>{{ t("walletSetup.replaceWarning") }}</p></div>
        <form class="auth-form" @submit.prevent="doReplace">
          <label class="auth-field">
            <span>{{ t("walletSetup.secretInputLabel") }}</span>
            <input
              v-model="replaceSecret"
              type="password"
              autocomplete="off"
              spellcheck="false"
              :placeholder="t('walletSetup.secretInputPlaceholder')"
            />
          </label>
          <label class="auth-field">
            <span>{{ t("walletSetup.passwordLabel") }}</span>
            <input
              v-model="replacePassword"
              type="password"
              autocomplete="current-password"
              :placeholder="t('walletSetup.passwordPlaceholder')"
            />
          </label>
          <!-- AUDIT-007: distinct confirmation step for a destructive action. -->
          <label class="auth-field">
            <span>{{ t("walletSetup.replaceConfirmLabel") }}</span>
            <input
              v-model="replaceConfirm4"
              type="text"
              autocomplete="off"
              spellcheck="false"
              maxlength="4"
              :placeholder="t('walletSetup.replaceConfirmPlaceholder')"
            />
          </label>
          <button class="btn danger auth-submit" type="submit" :disabled="loading">
            {{ t("walletSetup.replaceBtn") }}
          </button>
        </form>
      </details>
    </template>
  </AuthLayout>
</template>

<style scoped>
.ws-choices {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}
.ws-choice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-2);
  color: var(--text);
  cursor: pointer;
  transition: border-color 0.15s;
}
.ws-choice:hover {
  border-color: var(--accent);
}
.ws-choice strong {
  font-size: 15px;
}
.ws-choice span {
  font-size: 13px;
}
.ws-warn {
  border: 1px solid var(--warn);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 14px 0;
  background: color-mix(in srgb, var(--warn) 10%, transparent);
}
.ws-warn strong {
  color: var(--warn);
}
.ws-warn p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
}
/* Fund-safety acknowledgement checkbox (create flow). The label supplies the
   App/Play Store 44px touch-target floor so the small checkbox is easy to hit. */
.ws-ack {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
  cursor: pointer;
  min-height: 44px;
  padding: 6px 0;
}
.ws-ack input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-top: 1px;
  accent-color: var(--accent);
  cursor: pointer;
}
.ws-keyrow {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.ws-key {
  flex: 1;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 6px;
}
.ws-secret {
  color: var(--warn);
}
.ws-copy {
  white-space: nowrap;
  flex: 0 0 auto;
}
.ws-status {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 14px 0;
  font-size: 13px;
}
.ws-fund {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}
.ws-ok {
  color: var(--pos);
  font-size: 13px;
}
.ws-replace {
  margin-top: 22px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}
.ws-replace summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
}
/* Multi-chain: setup-picker group headings + the manage chain list. */
.ws-chainhead {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}
.ws-chaindesc {
  font-size: 13px;
  margin: 4px 0 8px;
}
.ws-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  color: var(--accent);
  white-space: nowrap;
}
.ws-badge-opt {
  border-color: var(--line);
  color: var(--muted);
}
.ws-chains {
  margin-top: 22px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}
.ws-chains-title {
  font-size: 15px;
  margin: 0 0 6px;
}
.ws-chainrow {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.ws-chainrow:last-child {
  border-bottom: none;
}
.ws-chainmain {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ws-chainmain .ws-chainhead {
  margin-top: 0;
}
.ws-chainbal {
  font-size: 13px;
}
.ws-chainactions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.ws-chainactions .btn {
  min-height: 44px;
}
.ws-chainblock {
  flex-basis: 100%;
  font-size: 12px;
  margin: 0;
}
.ws-removeconfirm {
  flex-basis: 100%;
}
</style>
