<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { api, UnauthorizedError, type AdminUser } from "../api";
import { truncateMiddle, utcStamp, xlm } from "../format";

const emit = defineEmits<{ (e: "unauthorized"): void }>();

const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

const users = ref<AdminUser[]>([]);
const error = ref("");
const flaggedOnly = ref(false);
const confirmDisableId = ref<string | null>(null);
const rowBusy = ref<string | null>(null);
const rowMsg = ref<Record<string, string>>({});

async function load(): Promise<void> {
  error.value = "";
  try {
    const res = await api.users();
    users.value = res.users;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    error.value = (err as Error).message;
  }
}

const visible = computed(() => (flaggedOnly.value ? users.value.filter((u) => u.flaggedForReview) : users.value));

function tierSelectValue(u: AdminUser): string {
  return u.tierOverride ?? "auto";
}

async function changeTier(u: AdminUser, tier: string): Promise<void> {
  rowBusy.value = u.id;
  rowMsg.value = { ...rowMsg.value, [u.id]: "" };
  try {
    await api.setUserTier(u.id, tier);
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    rowMsg.value = { ...rowMsg.value, [u.id]: (err as Error).message };
  } finally {
    rowBusy.value = null;
  }
}

async function toggleFlag(u: AdminUser): Promise<void> {
  rowBusy.value = u.id;
  try {
    await api.setUserFlagged(u.id, !u.flaggedForReview);
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    rowMsg.value = { ...rowMsg.value, [u.id]: (err as Error).message };
  } finally {
    rowBusy.value = null;
  }
}

function askDisable(u: AdminUser): void {
  confirmDisableId.value = u.id;
}
function cancelDisable(): void {
  confirmDisableId.value = null;
}

async function confirmToggleDisable(u: AdminUser): Promise<void> {
  rowBusy.value = u.id;
  confirmDisableId.value = null;
  try {
    await api.setUserDisabled(u.id, !u.disabledByAdmin);
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    rowMsg.value = { ...rowMsg.value, [u.id]: (err as Error).message };
  } finally {
    rowBusy.value = null;
  }
}

async function enableDirectly(u: AdminUser): Promise<void> {
  // Re-enabling doesn't need a confirm step — only disabling does.
  rowBusy.value = u.id;
  try {
    await api.setUserDisabled(u.id, false);
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    rowMsg.value = { ...rowMsg.value, [u.id]: (err as Error).message };
  } finally {
    rowBusy.value = null;
  }
}

onMounted(load);
</script>

<template>
  <div class="tab-body">
    <p class="foot-note">
      User emails are deliberately not available here (GDPR — ids only).
    </p>

    <section class="panel">
      <div class="confirm-row" style="justify-content: space-between">
        <h2 style="margin: 0">Users</h2>
        <label class="switch" style="display: flex; align-items: center; gap: 8px; cursor: pointer">
          <input type="checkbox" v-model="flaggedOnly" />
          <span>Flagged for review only</span>
        </label>
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="table-wrap" style="margin-top: 12px">
        <table class="data">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Registered</th>
              <th>Last active</th>
              <th>Tier</th>
              <th>Premium</th>
              <th class="num">Volume XLM</th>
              <th>Flags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in visible" :key="u.id">
              <td class="mono">{{ truncateMiddle(u.id) }}</td>
              <td>{{ utcStamp(u.createdAt) }}</td>
              <td>{{ utcStamp(u.lastLoginAt) }}</td>
              <td>
                <select
                  class="inline-select"
                  :value="tierSelectValue(u)"
                  :disabled="rowBusy === u.id"
                  @change="changeTier(u, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="t in TIERS" :key="t" :value="t">{{ t }}</option>
                  <option value="auto">auto</option>
                </select>
                <span v-if="u.tierOverride" class="pinned-badge">pinned</span>
              </td>
              <td>{{ u.isPremium ? "Yes" : "No" }}</td>
              <td class="num">{{ xlm(u.totalVolumeXlm) }}</td>
              <td>
                <span v-if="u.flaggedForReview" class="flag-on">Flagged</span>
                <span v-if="u.disabledByAdmin" class="neg" style="margin-left: 6px">Disabled</span>
              </td>
              <td>
                <div v-if="confirmDisableId === u.id" class="confirm-row">
                  <button class="btn danger small" :disabled="rowBusy === u.id" @click="confirmToggleDisable(u)">
                    Confirm
                  </button>
                  <button class="btn small" @click="cancelDisable">Cancel</button>
                </div>
                <div v-else class="confirm-row">
                  <button
                    v-if="!u.disabledByAdmin"
                    class="btn small danger"
                    :disabled="rowBusy === u.id"
                    @click="askDisable(u)"
                  >
                    Disable
                  </button>
                  <button
                    v-else
                    class="btn small ok"
                    :disabled="rowBusy === u.id"
                    @click="enableDirectly(u)"
                  >
                    Enable
                  </button>
                  <button class="btn small" :disabled="rowBusy === u.id" @click="toggleFlag(u)">
                    {{ u.flaggedForReview ? "Unflag" : "Flag" }}
                  </button>
                </div>
                <p v-if="rowMsg[u.id]" class="error-text" style="margin-top: 6px">{{ rowMsg[u.id] }}</p>
              </td>
            </tr>
            <tr v-if="visible.length === 0">
              <td colspan="8" class="center muted">No users to show.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="hint" style="margin-top: 10px">Accounts with &gt;500 trades/day are auto-flagged.</p>
    </section>
  </div>
</template>
