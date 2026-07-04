// Client-side premium/billing state (Feature 2). Same module-singleton pattern
// as wallet/walletState.ts: a small reactive object + a cached loader. The
// server is authoritative (the AI endpoints re-check premium on every call);
// this state only drives UI - locked panels, the Upgrade sidebar entry, the
// pricing page's "your tier" strip.
import { reactive } from "vue";
import { billingApi, type BillingStatus } from "../api";

export const billingState = reactive<{
  loaded: boolean;
  billingConfigured: boolean;
  feesEnabled: boolean;
  isPremium: boolean;
  tier: string;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  currentRates: { manual: number; ai: number | null };
  rateTable: BillingStatus["rateTable"] | null;
  prices: { monthlyEur: number; annualEur: number };
}>({
  loaded: false,
  billingConfigured: false,
  feesEnabled: false,
  isPremium: false,
  tier: "Bronze",
  subscriptionStatus: null,
  subscriptionEnd: null,
  currentRates: { manual: 0.0028, ai: null },
  rateTable: null,
  prices: { monthlyEur: 10, annualEur: 96 },
});

let inflight: Promise<void> | null = null;

export async function loadBillingStatus(force = false): Promise<void> {
  if (billingState.loaded && !force) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const s = await billingApi.status();
      billingState.billingConfigured = s.billingConfigured;
      billingState.feesEnabled = s.feesEnabled;
      billingState.isPremium = s.isPremium;
      billingState.tier = s.tier;
      billingState.subscriptionStatus = s.subscriptionStatus;
      billingState.subscriptionEnd = s.subscriptionEnd;
      billingState.currentRates = s.currentRates;
      billingState.rateTable = s.rateTable;
      billingState.prices = s.prices;
      billingState.loaded = true;
    } catch {
      // Leave loaded=false: gates fail toward "free" locally; the server still
      // enforces premium on every AI call regardless.
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function resetBillingState(): void {
  billingState.loaded = false;
  billingState.isPremium = false;
  billingState.subscriptionStatus = null;
  billingState.subscriptionEnd = null;
}
