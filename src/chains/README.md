# `src/chains` — chain abstraction layer (WIRED, 2026-07-24)

The `ChainAdapter` seam + chain-qualified asset identity that lets Atrium
support chains beyond Stellar. As of 2026-07-24 this is LIVE:
- The **orchestrator** routes every market read and the whole prepare→sign→
  submit execution path through `adapterFor("stellar")`; fill reconciliation
  lives in `stellar/reconcile.ts`.
- The **monitor**'s stale-offer cancel (write path) goes through the adapter;
  its read-reconciliation (`fillFromEffects`, tx polling) is still
  Stellar-direct — see the TODO(chain-adapter) note in `monitor.ts`.
- The **wallet layer** is multi-chain: per-`(user, network, chain)` wallets
  (`dbo.Wallets.chain`), per-chain register/overview/remove endpoints, and a
  **Solana** wallet-level adapter (non-custodial only). `CHAINS=stellar,solana`
  enables it.
- `fees/collector.ts` stays Stellar-direct on purpose (fees only exist on
  Stellar trades today).
- Trading remains **Stellar-only**: the Solana adapter throws
  `NotSupportedOnChainError` on every trading method (plan: `solana/README.md`);
  cross-chain conversion is designed but unbuilt (`bridge/README.md`).

## Files
| File | What it is | Purity |
|---|---|---|
| `assetId.ts` | `AssetId` type + `parseAssetRef`/`formatAsset` with a backward-compatible string shim (legacy `"XLM"｜"CODE:ISSUER"` ⇄ new `"chain:symbol[:id]"`) | pure |
| `types.ts` | The `ChainAdapter` interface + chain-neutral value types (`Fill`, `OrderReceipt`, `PreparedOrder`, `SignedOrder`, `OpenOrder`, `FeeEstimate`) | types only |
| `stellar/reconcile.ts` | Pure fill reconciliation (Horizon `offerResults` → `Fill`), lifted from `orchestrator.reconcileOfferFill` minus its logging | pure |
| `stellar/adapter.ts` | The Stellar adapter — a **thin facade** delegating to existing `src/stellar/*` | facade |
| `registry.ts` | `adapterFor(chain)` → adapter (Stellar only, for now) | — |
| `*.test.ts` | Unit tests (assetId shim, reconciliation, registry) | — |

## Design invariants preserved
- **prepare → sign → submit split.** `sign()` returns a `handle` that MUST be
  persisted before `submit()` (Stellar: the tx hash) — the crash-recovery
  invariant from `orchestrator.executeInner`.
- **Opaque payload.** `PreparedOrder.payload` is chain-private (Stellar hides the
  SDK `Transaction` there) so the trading domain never imports chain SDK types.
- **Canonical string is the wire/storage form.** `formatAsset` emits the exact
  legacy `"XLM"｜"CODE:ISSUER"` for Stellar, so existing DB rows/behaviour are
  untouched; the new `"chain:…"` form is only emitted for other chains.

## Remaining follow-ups
1. Monitor read-reconciliation: add `getOrderFills`/`getTransactionOutcome` to
   the interface and retire the direct `fillFromEffects`/Horizon polling in
   `monitor.ts` (TODO(chain-adapter) marks the spot).
2. `types.ts` domain types: optional `chain?: ChainId` (default `"stellar"`) on
   asset-bearing types + the additive `chain` column on the remaining 11
   asset/trade tables (Wallets already has it) — needed only when a second
   chain actually TRADES (never rewrite historical `FeeLedger` rows).
3. Solana trading leg (Jupiter first) — `solana/README.md`.
4. Cross-chain Convert (CCTP composed swap) — `bridge/README.md`.
5. A Stellar **testnet** forward-test verifying identical trade/fill/PnL
   behaviour post-reroute (typecheck + full suite are green; a live testnet
   pass has not run).
