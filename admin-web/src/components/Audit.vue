<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, UnauthorizedError, type AuditEntry } from "../api";
import { utcStamp } from "../format";

const emit = defineEmits<{ (e: "unauthorized"): void }>();

const entries = ref<AuditEntry[]>([]);
const error = ref("");

async function load(): Promise<void> {
  error.value = "";
  try {
    const res = await api.audit(100);
    // newest first
    entries.value = [...res.entries].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    error.value = (err as Error).message;
  }
}

onMounted(load);
</script>

<template>
  <div class="tab-body">
    <section class="panel">
      <h2>Audit trail</h2>
      <p class="hint">This is an immutable log — entries cannot be edited or deleted.</p>

      <p v-if="error" class="error-text">{{ error }}</p>

      <div class="table-wrap" style="margin-top: 12px">
        <table class="data">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in entries" :key="i">
              <td>{{ utcStamp(e.ts) }}</td>
              <td>{{ e.admin }}</td>
              <td>{{ e.action }}</td>
              <td class="mono">{{ e.target ?? "—" }}</td>
              <td>{{ e.detail ?? "—" }}</td>
            </tr>
            <tr v-if="entries.length === 0">
              <td colspan="5" class="center muted">No audit entries yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
